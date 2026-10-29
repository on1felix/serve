//! Работа со службами Windows через WinAPI (advapi32).
//!
//! Здесь всё, что касается SCM: перечисление, чтение конфигурации,
//! изменение типа запуска, старт и остановка. Все функции возвращают
//! русскоязычные ошибки, которые фронтенд показывает как есть.

use serde::Serialize;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::ptr;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use windows_sys::Win32::Foundation::GetLastError;
use windows_sys::Win32::System::Services::*;

use crate::{kb, kb_en};

const SCM_ACCESS: u32 = SC_MANAGER_CONNECT | SC_MANAGER_ENUMERATE_SERVICE;
const FULL_ACCESS: u32 = SERVICE_QUERY_CONFIG
    | SERVICE_CHANGE_CONFIG
    | SERVICE_QUERY_STATUS
    | SERVICE_START
    | SERVICE_STOP;
const READ_ACCESS: u32 = SERVICE_QUERY_CONFIG | SERVICE_QUERY_STATUS;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInfo {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub status: String,
    pub start_type: String,
    pub delayed: bool,
    pub pid: u32,
    pub can_stop: bool,
    pub can_change: bool,
    pub is_system: bool,
    pub is_critical: bool,
    pub verdict: String,
    pub note: String,
    pub note_en: String,
    pub binary_path: String,
    pub account: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionOutcome {
    pub ok: bool,
    pub message: String,
    pub warning: Option<String>,
}

fn outcome(message: impl Into<String>) -> ActionOutcome {
    ActionOutcome { ok: true, message: message.into(), warning: None }
}

struct Scm(SC_HANDLE);
impl Drop for Scm {
    fn drop(&mut self) {
        unsafe { CloseServiceHandle(self.0) };
    }
}

struct Svc(SC_HANDLE);
impl Drop for Svc {
    fn drop(&mut self) {
        unsafe { CloseServiceHandle(self.0) };
    }
}

fn wide(s: &str) -> Vec<u16> {
    OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

fn pcwstr_to_string(p: *const u16) -> String {
    if p.is_null() {
        return String::new();
    }
    let mut len = 0usize;
    unsafe {
        while *p.add(len) != 0 {
            len += 1;
            if len > 32_768 {
                break;
            }
        }
        String::from_utf16_lossy(std::slice::from_raw_parts(p, len))
    }
}

fn open_scm() -> Result<Scm, String> {
    let h = unsafe { OpenSCManagerW(ptr::null(), ptr::null(), SCM_ACCESS) };
    if h.is_null() {
        Err(format!("Не удалось открыть менеджер служб: {}", last_error_hint()))
    } else {
        Ok(Scm(h))
    }
}

fn open_service(name: &str, access: u32) -> Result<Svc, String> {
    let scm = open_scm()?;
    open_service_on(scm.0, name, access)
}

/// Открыть службу на уже открытом менеджере: перечисление списка не должно
/// заново подключаться к SCM на каждую службу.
fn open_service_on(scm: SC_HANDLE, name: &str, access: u32) -> Result<Svc, String> {
    let wname = wide(name);
    let h = unsafe { OpenServiceW(scm, wname.as_ptr(), access) };
    if h.is_null() {
        Err(format!(
            "Не удалось открыть службу «{}»: {}",
            name,
            last_error_hint()
        ))
    } else {
        Ok(Svc(h))
    }
}

fn last_error_hint() -> String {
    let code = unsafe { GetLastError() };
    let hint = match code {
        5 => "доступ запрещён (нужны права администратора)",
        1060 => "служба не существует",
        1061 => "служба сейчас не принимает команды",
        1062 => "служба не запущена",
        1072 => "служба помечена для удаления",
        1073 => "служба уже запущена",
        _ => "ошибка Windows",
    };
    format!("{hint}, код {code}")
}

fn status_of(h: SC_HANDLE) -> Result<SERVICE_STATUS_PROCESS, String> {
    let mut buf = vec![0u64; 16];
    let mut needed = 0u32;
    let ok = unsafe {
        QueryServiceStatusEx(
            h,
            SC_STATUS_PROCESS_INFO,
            buf.as_mut_ptr() as *mut u8,
            (buf.len() * 8) as u32,
            &mut needed,
        )
    };
    if ok == 0 {
        return Err(format!("Не удалось получить состояние: {}", last_error_hint()));
    }
    Ok(unsafe { *(buf.as_ptr() as *const SERVICE_STATUS_PROCESS) })
}

fn status_name(state: u32) -> &'static str {
    match state {
        SERVICE_RUNNING => "running",
        SERVICE_STOPPED => "stopped",
        SERVICE_START_PENDING => "start_pending",
        SERVICE_STOP_PENDING => "stop_pending",
        SERVICE_PAUSED => "paused",
        SERVICE_PAUSE_PENDING => "pause_pending",
        SERVICE_CONTINUE_PENDING => "continue_pending",
        _ => "unknown",
    }
}

fn start_type_name(t: u32) -> &'static str {
    match t {
        SERVICE_BOOT_START => "boot",
        SERVICE_SYSTEM_START => "system",
        SERVICE_AUTO_START => "auto",
        SERVICE_DEMAND_START => "manual",
        SERVICE_DISABLED => "disabled",
        _ => "unknown",
    }
}

struct ConfigInfo {
    start_type: u32,
    binary_path: String,
    account: String,
}

fn query_config(h: SC_HANDLE) -> Option<ConfigInfo> {
    for size in [8 * 1024usize, 64 * 1024] {
        let mut buf = vec![0u64; size / 8];
        let mut needed = 0u32;
        let ok = unsafe {
            QueryServiceConfigW(
                h,
                buf.as_mut_ptr() as *mut QUERY_SERVICE_CONFIGW,
                size as u32,
                &mut needed,
            )
        };
        if ok != 0 {
            let cfg = unsafe { *(buf.as_ptr() as *const QUERY_SERVICE_CONFIGW) };
            return Some(ConfigInfo {
                start_type: cfg.dwStartType,
                binary_path: pcwstr_to_string(cfg.lpBinaryPathName),
                account: pcwstr_to_string(cfg.lpServiceStartName),
            });
        }
        if unsafe { GetLastError() } != 122 {
            return None;
        }
    }
    None
}

fn query_description(h: SC_HANDLE) -> String {
    for size in [4 * 1024usize, 32 * 1024] {
        let mut buf = vec![0u64; size / 8];
        let mut needed = 0u32;
        let ok = unsafe {
            QueryServiceConfig2W(
                h,
                SERVICE_CONFIG_DESCRIPTION,
                buf.as_mut_ptr() as *mut u8,
                size as u32,
                &mut needed,
            )
        };
        if ok != 0 {
            let desc = unsafe { *(buf.as_ptr() as *const SERVICE_DESCRIPTIONW) };
            return pcwstr_to_string(desc.lpDescription).trim().to_string();
        }
        if unsafe { GetLastError() } != 122 {
            return String::new();
        }
    }
    String::new()
}

fn query_delayed(h: SC_HANDLE) -> bool {
    let mut buf = vec![0u64; 4];
    let mut needed = 0u32;
    let ok = unsafe {
        QueryServiceConfig2W(
            h,
            SERVICE_CONFIG_DELAYED_AUTO_START_INFO,
            buf.as_mut_ptr() as *mut u8,
            32,
            &mut needed,
        )
    };
    if ok == 0 {
        return false;
    }
    let info = unsafe { *(buf.as_ptr() as *const SERVICE_DELAYED_AUTO_START_INFO) };
    info.fDelayedAutostart != 0
}

fn system_root() -> String {
    std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".to_string())
}

fn normalize_path(path: &str) -> String {
    let mut p = path.trim().trim_matches('"').to_string();
    if let Some(rest) = p.strip_prefix("\\??\\") {
        p = rest.to_string();
    }
    let root = system_root();
    if p.to_lowercase().starts_with("\\systemroot") {
        p = p.replacen("\\SystemRoot", &root, 1);
        p = p.replacen("\\systemroot", &root, 1);
    }
    p
}

fn is_third_party(name: &str) -> bool {
    let n = name.to_ascii_lowercase();
    const VENDORS: &[&str] = &[
        "nvidia",
        "nvcontainer",
        "nvagent",
        "nvdisplay",
        "steam",
        "epic",
        "easyanticheat",
        "rockstar",
        "radmin",
        "cloudflare",
        "mbam",
        "malwarebytes",
        "google",
        "anydesk",
        "cowork",
        "claude",
        "pcmanager",
        "redragon",
        "openrgb",
        "msi",
        "afterburner",
        "droidcam",
        "audiorelay",
        "soundpad",
        "equalizer",
        "loaris",
        "revo",
        "rsi",
        "pawnio",
        "vbcable",
        "vbaudio",
    ];
    VENDORS.iter().any(|v| n.contains(v))
}

/// Статические поля службы: описание, путь, тип запуска. Меняются только
/// при правке конфигурации, поэтому их незачем перечитывать каждую секунду.
struct Static {
    description: String,
    binary_path: String,
    account: String,
    start_raw: u32,
    delayed: bool,
    can_change: bool,
    is_system: bool,
}

struct Cache {
    at: Option<Instant>,
    items: HashMap<String, Static>,
}

/// Сколько живёт кэш статических полей. Состояние и PID приходят живьём
/// при каждом вызове, а конфигурация меняется редко: без кэша секундный
/// опрос делал бы больше тысячи вызовов диспетчера служб в секунду.
const STATIC_TTL: Duration = Duration::from_secs(30);

fn cache() -> &'static Mutex<Cache> {
    static CACHE: OnceLock<Mutex<Cache>> = OnceLock::new();
    CACHE.get_or_init(|| {
        Mutex::new(Cache {
            at: None,
            items: HashMap::new(),
        })
    })
}

/// Сбросить кэш — например, после того как мы сами поменяли конфигурацию.
fn invalidate() {
    if let Ok(mut cache) = cache().lock() {
        cache.at = None;
    }
}

/// Перечислить все службы WIN32 с описанием и оценкой риска.
pub fn list() -> Result<Vec<ServiceInfo>, String> {
    let scm = open_scm()?;
    let root = system_root().to_lowercase();
    let entries = enumerate(scm.0)?;

    let mut cache = cache()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());

    let stale = cache.at.map_or(true, |at| at.elapsed() >= STATIC_TTL);
    if stale {
        cache.items.clear();
    }

    let mut result: Vec<ServiceInfo> = Vec::with_capacity(entries.len());

    for (name, display_name, st) in entries {
        if !cache.items.contains_key(&name) {
            match statics(scm.0, &name, &root) {
                Some(info) => {
                    cache.items.insert(name.clone(), info);
                }
                None => continue,
            }
        }
        let info = &cache.items[&name];

        let (verdict, note) = kb::meta(&name);
        let is_critical = kb::is_critical(&name);
        let note_en = kb_en::note(&name);

        result.push(ServiceInfo {
            display_name,
            status: status_name(st.dwCurrentState).to_string(),
            start_type: start_type_name(info.start_raw).to_string(),
            delayed: info.delayed,
            pid: st.dwProcessId,
            can_stop: st.dwControlsAccepted & SERVICE_ACCEPT_STOP != 0,
            can_change: info.can_change,
            is_system: info.is_system,
            is_critical,
            verdict: verdict.to_string(),
            note: note.to_string(),
            note_en: note_en.to_string(),
            binary_path: info.binary_path.clone(),
            account: info.account.clone(),
            description: info.description.clone(),
            name,
        });
    }

    if stale {
        cache.at = Some(Instant::now());
    }
    drop(cache);

    result.sort_by(|a, b| {
        a.display_name
            .to_lowercase()
            .cmp(&b.display_name.to_lowercase())
    });
    Ok(result)
}

/// Один проход перечисления: имя, отображаемое имя и живой статус.
fn enumerate(scm: SC_HANDLE) -> Result<Vec<(String, String, SERVICE_STATUS_PROCESS)>, String> {
    let mut entries = Vec::new();
    let mut resume: u32 = 0;
    // Службы перечисляются порциями: большой буфер (мегабайт и больше)
    // диспетчер служб отвергает с ошибкой RPC 1783.
    const CHUNK: usize = 64 * 1024;
    let mut buf = vec![0u64; CHUNK / 8];

    loop {
        let mut needed = 0u32;
        let mut returned = 0u32;
        let ok = unsafe {
            EnumServicesStatusExW(
                scm,
                SC_ENUM_PROCESS_INFO,
                SERVICE_WIN32,
                SERVICE_STATE_ALL,
                buf.as_mut_ptr() as *mut u8,
                CHUNK as u32,
                &mut needed,
                &mut returned,
                &mut resume,
                ptr::null(),
            )
        };

        let err = if ok == 0 { unsafe { GetLastError() } } else { 0 };

        if ok == 0 && err != 234 && err != 259 {
            return Err(format!(
                "Не удалось получить список служб: {}",
                last_error_hint()
            ));
        }

        let items = unsafe {
            std::slice::from_raw_parts(
                buf.as_ptr() as *const ENUM_SERVICE_STATUS_PROCESSW,
                returned as usize,
            )
        };

        for item in items {
            let name = pcwstr_to_string(item.lpServiceName);
            if name.is_empty() {
                continue;
            }
            entries.push((
                name,
                pcwstr_to_string(item.lpDisplayName),
                item.ServiceStatusProcess,
            ));
        }

        if ok != 0 || err == 259 || returned == 0 {
            break;
        }
    }

    Ok(entries)
}

/// Читает статические поля одной службы.
fn statics(scm: SC_HANDLE, name: &str, root: &str) -> Option<Static> {
    let (svc, can_change) = match open_service_on(scm, name, FULL_ACCESS) {
        Ok(svc) => (svc, true),
        Err(_) => (open_service_on(scm, name, READ_ACCESS).ok()?, false),
    };

    let (binary_path, account, start_raw) = match query_config(svc.0) {
        Some(cfg) => (cfg.binary_path, cfg.account, cfg.start_type),
        None => (String::new(), String::new(), u32::MAX),
    };

    let description = query_description(svc.0);
    let delayed = start_raw == SERVICE_AUTO_START && query_delayed(svc.0);

    let normalized = normalize_path(&binary_path).to_lowercase();
    let is_system = if is_third_party(name) {
        false
    } else if normalized.is_empty() {
        true
    } else {
        normalized.starts_with(root)
    };

    Some(Static {
        description,
        binary_path,
        account,
        start_raw,
        delayed,
        can_change,
        is_system,
    })
}

fn wait_for(h: SC_HANDLE, target: u32, timeout_ms: u64) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_millis(timeout_ms);
    loop {
        let st = status_of(h)?;
        if st.dwCurrentState == target {
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("Превышено время ожидания ответа службы".to_string());
        }
        std::thread::sleep(Duration::from_millis(150));
    }
}

fn stop_handle(h: SC_HANDLE) -> Result<(), String> {
    let st = status_of(h)?;
    if st.dwCurrentState == SERVICE_STOPPED {
        return Ok(());
    }
    let mut status: SERVICE_STATUS = unsafe { std::mem::zeroed() };
    let ok = unsafe { ControlService(h, SERVICE_CONTROL_STOP, &mut status) };
    if ok == 0 {
        let code = unsafe { GetLastError() };
        if code == 1062 {
            return Ok(());
        }
        return Err(format!("Не удалось остановить службу: {}", last_error_hint()));
    }
    wait_for(h, SERVICE_STOPPED, 25_000)
}

pub fn stop(name: &str) -> Result<ActionOutcome, String> {
    let svc = open_service(name, SERVICE_STOP | SERVICE_QUERY_STATUS | SERVICE_QUERY_CONFIG)?;
    let st = status_of(svc.0)?;
    if st.dwCurrentState == SERVICE_STOPPED {
        return Ok(outcome("Служба уже остановлена"));
    }
    if st.dwControlsAccepted & SERVICE_ACCEPT_STOP == 0 {
        return Err("Эта служба не поддерживает остановку".to_string());
    }
    stop_handle(svc.0)?;
    Ok(outcome("Служба остановлена"))
}

pub fn start(name: &str) -> Result<ActionOutcome, String> {
    let svc = open_service(name, SERVICE_START | SERVICE_QUERY_STATUS | SERVICE_QUERY_CONFIG)?;

    if let Some(cfg) = query_config(svc.0) {
        if cfg.start_type == SERVICE_DISABLED {
            return Err("Служба отключена. Сначала включите её, затем запустите.".to_string());
        }
    }

    let st = status_of(svc.0)?;
    if st.dwCurrentState == SERVICE_RUNNING {
        return Ok(outcome("Служба уже работает"));
    }

    let ok = unsafe { StartServiceW(svc.0, 0, ptr::null()) };
    if ok == 0 {
        let code = unsafe { GetLastError() };
        if code == 1056 {
            return Ok(outcome("Служба уже работает"));
        }
        return Err(format!("Не удалось запустить службу: {}", last_error_hint()));
    }

    match wait_for(svc.0, SERVICE_RUNNING, 35_000) {
        Ok(()) => Ok(outcome("Служба запущена")),
        Err(e) => Ok(ActionOutcome {
            ok: true,
            message: "Команда запуска отправлена".to_string(),
            warning: Some(format!("{e}. Проверьте состояние через несколько секунд.")),
        }),
    }
}

pub fn restart(name: &str) -> Result<ActionOutcome, String> {
    let svc = open_service(
        name,
        SERVICE_STOP | SERVICE_START | SERVICE_QUERY_STATUS | SERVICE_QUERY_CONFIG,
    )?;
    let st = status_of(svc.0)?;
    if st.dwCurrentState != SERVICE_STOPPED {
        stop_handle(svc.0)?;
    }
    let ok = unsafe { StartServiceW(svc.0, 0, ptr::null()) };
    if ok == 0 {
        return Err(format!("Не удалось запустить службу: {}", last_error_hint()));
    }
    wait_for(svc.0, SERVICE_RUNNING, 35_000)?;
    Ok(outcome("Служба перезапущена"))
}

fn change_start(h: SC_HANDLE, start: u32) -> Result<(), String> {
    let ok = unsafe {
        ChangeServiceConfigW(
            h,
            SERVICE_NO_CHANGE,
            start,
            SERVICE_NO_CHANGE,
            ptr::null(),
            ptr::null(),
            ptr::null_mut(),
            ptr::null(),
            ptr::null(),
            ptr::null(),
            ptr::null(),
        )
    };
    if ok == 0 {
        Err(format!(
            "Не удалось изменить тип запуска: {}",
            last_error_hint()
        ))
    } else {
        Ok(())
    }
}

fn set_delayed(h: SC_HANDLE, delayed: bool) -> Result<(), String> {
    let mut info = SERVICE_DELAYED_AUTO_START_INFO {
        fDelayedAutostart: if delayed { 1 } else { 0 },
    };
    let ok = unsafe {
        ChangeServiceConfig2W(
            h,
            SERVICE_CONFIG_DELAYED_AUTO_START_INFO,
            &mut info as *mut _ as *const core::ffi::c_void,
        )
    };
    if ok == 0 {
        Err(format!(
            "Не удалось изменить отложенный запуск: {}",
            last_error_hint()
        ))
    } else {
        Ok(())
    }
}

/// Отключить службу и, если она работает, остановить её.
pub fn disable(name: &str) -> Result<ActionOutcome, String> {
    if kb::is_critical(name) {
        return Err(
            "Это критическая системная служба. Её отключение нарушит работу Windows, поэтому действие заблокировано."
                .to_string(),
        );
    }

    let svc = open_service(
        name,
        SERVICE_CHANGE_CONFIG | SERVICE_QUERY_STATUS | SERVICE_STOP | SERVICE_QUERY_CONFIG,
    )?;

    change_start(svc.0, SERVICE_DISABLED)?;
    invalidate();

    let st = status_of(svc.0);
    let running = st
        .as_ref()
        .map(|s| s.dwCurrentState != SERVICE_STOPPED)
        .unwrap_or(false);

    if !running {
        return Ok(outcome("Служба отключена"));
    }

    match stop_handle(svc.0) {
        Ok(()) => Ok(outcome("Служба отключена и остановлена")),
        Err(e) => Ok(ActionOutcome {
            ok: true,
            message: "Служба отключена".to_string(),
            warning: Some(format!(
                "{e}. Она перестанет работать после перезагрузки Windows."
            )),
        }),
    }
}

pub fn set_startup(name: &str, kind: &str) -> Result<ActionOutcome, String> {
    match kind {
        "disabled" => return disable(name),
        "manual" | "auto" | "auto_delayed" => {}
        other => return Err(format!("Неизвестный тип запуска: {other}")),
    }

    let svc = open_service(name, SERVICE_CHANGE_CONFIG | SERVICE_QUERY_CONFIG | SERVICE_QUERY_STATUS)?;

    let result = match kind {
        "manual" => {
            change_start(svc.0, SERVICE_DEMAND_START)?;
            Ok(outcome("Тип запуска: вручную"))
        }
        "auto" => {
            change_start(svc.0, SERVICE_AUTO_START)?;
            let _ = set_delayed(svc.0, false);
            Ok(outcome("Тип запуска: автоматически"))
        }
        "auto_delayed" => {
            change_start(svc.0, SERVICE_AUTO_START)?;
            let _ = set_delayed(svc.0, true);
            Ok(outcome("Тип запуска: автоматически (отложенно)"))
        }
        _ => unreachable!(),
    };

    invalidate();
    result
}
