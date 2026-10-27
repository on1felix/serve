//! Проверка прав администратора и перезапуск с повышением (UAC).
//!
//! Читать список служб можно и без прав, а вот менять тип запуска,
//! останавливать и запускать — только от администратора. Поэтому
//! приложение стартует обычным процессом и предлагает перезапуститься
//! с правами, когда пользователь реально что-то меняет.

use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::ptr;

use windows_sys::Win32::Foundation::CloseHandle;
use windows_sys::Win32::Security::{
    GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY,
};
use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};
use windows_sys::Win32::UI::Shell::ShellExecuteW;
use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

fn wide(s: &str) -> Vec<u16> {
    OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

pub fn is_elevated() -> bool {
    unsafe {
        let mut token = ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
            return false;
        }

        let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
        let mut returned = 0u32;
        let ok = GetTokenInformation(
            token,
            TokenElevation,
            &mut elevation as *mut _ as *mut core::ffi::c_void,
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut returned,
        );
        CloseHandle(token);

        ok != 0 && elevation.TokenIsElevated != 0
    }
}

/// Перезапустить приложение через UAC. При успехе текущий процесс
/// завершается, чтобы не было двух окон сразу.
pub fn relaunch_elevated() -> Result<(), String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Не удалось определить путь к программе: {e}"))?;
    let dir = exe
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let verb = wide("runas");
    let file = wide(&exe.to_string_lossy());
    let directory = wide(&dir);

    let rc = unsafe {
        ShellExecuteW(
            ptr::null_mut(),
            verb.as_ptr(),
            file.as_ptr(),
            ptr::null(),
            directory.as_ptr(),
            SW_SHOWNORMAL,
        )
    } as isize;

    if rc <= 32 {
        return Err(
            "Windows не разрешил перезапуск с правами администратора. \
             Скорее всего, запрос UAC был отклонён."
                .to_string(),
        );
    }

    std::thread::sleep(std::time::Duration::from_millis(500));
    std::process::exit(0);
}

/// Открывает http(s)-ссылку в браузере по умолчанию.
pub fn open_url(url: &str) -> Result<(), String> {
    let trimmed = url.trim();
    if !(trimmed.starts_with("https://") || trimmed.starts_with("http://")) {
        return Err("Разрешены только ссылки http и https.".to_string());
    }

    let verb = wide("open");
    let file = wide(trimmed);
    let rc = unsafe {
        ShellExecuteW(
            ptr::null_mut(),
            verb.as_ptr(),
            file.as_ptr(),
            ptr::null(),
            ptr::null(),
            SW_SHOWNORMAL,
        )
    } as isize;

    if rc <= 32 {
        return Err(format!("Windows не смог открыть ссылку (код {rc})."));
    }

    Ok(())
}
