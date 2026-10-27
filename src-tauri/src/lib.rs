//! Servo — менеджер служб Windows.
//!
//! Все команды ниже вызываются из `src/api.ts`. Имена команд и полей
//! должны совпадать с фронтендом, иначе invoke вернёт «command not found».

pub mod admin;
pub mod cleanup;
pub mod kb;
pub mod kb_en;
pub mod services;

use services::{ActionOutcome, ServiceInfo};

/// Изменять службы можно только с правами администратора.
fn require_admin() -> Result<(), String> {
    if admin::is_elevated() {
        Ok(())
    } else {
        Err(
            "Для изменения служб нужны права администратора. Нажмите «Запустить от имени администратора» вверху окна."
                .to_string(),
        )
    }
}

#[tauri::command]
async fn list_services() -> Result<Vec<ServiceInfo>, String> {
    // Перечисление служб — синхронные вызовы WinAPI. Уводим их в
    // отдельный поток, чтобы не блокировать главный поток окна:
    // иначе автообновление вызывает рывок при перетаскивании окна.
    tauri::async_runtime::spawn_blocking(services::list)
        .await
        .map_err(|e| format!("Не удалось выполнить перечисление служб: {e}"))?
}

#[tauri::command]
fn is_admin() -> bool {
    admin::is_elevated()
}

#[tauri::command]
fn restart_as_admin() -> Result<bool, String> {
    admin::relaunch_elevated()?;
    Ok(true)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    admin::open_url(&url)
}

#[tauri::command]
fn disable_service(name: String) -> Result<ActionOutcome, String> {
    require_admin()?;
    services::disable(&name)
}

#[tauri::command]
fn set_startup(name: String, kind: String) -> Result<ActionOutcome, String> {
    require_admin()?;
    services::set_startup(&name, &kind)
}

#[tauri::command]
fn start_service(name: String) -> Result<ActionOutcome, String> {
    require_admin()?;
    services::start(&name)
}

#[tauri::command]
fn stop_service(name: String) -> Result<ActionOutcome, String> {
    require_admin()?;
    services::stop(&name)
}

#[tauri::command]
fn restart_service(name: String) -> Result<ActionOutcome, String> {
    require_admin()?;
    services::restart(&name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // До создания окна: WebView2 ещё не занял файлы профиля.
    cleanup::prune();

    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_services,
            is_admin,
            restart_as_admin,
            open_url,
            disable_service,
            set_startup,
            start_service,
            stop_service,
            restart_service
        ])
        .build(tauri::generate_context!())
        .expect("Не удалось запустить Servo");

    app.run(|_app, event| {
        // На выходе подчищаем кэш, накопленный за сессию.
        if let tauri::RunEvent::Exit = event {
            cleanup::prune();
        }
    });
}
