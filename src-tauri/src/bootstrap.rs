//! Подготовка данных приложения до создания окна.
//!
//! Раньше Servo собирался в портативном режиме (`portable.conf.json`), и
//! профиль WebView2 лежал в папке `ServoData` рядом с exe. Теперь все данные
//! приложения хранятся в AppData:
//!
//! - `%LOCALAPPDATA%\com.servo.services\EBWebView` — профиль WebView2,
//!   а в нём localStorage: язык интерфейса и кэш ответов ИИ.
//!
//! Чтобы у пользователя не пропали настройки после обновления, при первом
//! запуске переносим старый профиль на новое место. Перенос делаем один раз:
//! если в AppData профиль уже есть, ничего не трогаем.

use std::fs;
use std::path::{Path, PathBuf};

/// Папка приложения в AppData — то же место, которое использует Tauri
/// (`app_local_data_dir`): `%LOCALAPPDATA%\<identifier>`.
fn app_data_dir() -> Option<PathBuf> {
    let local = std::env::var_os("LOCALAPPDATA")?;
    Some(PathBuf::from(local).join("com.servo.services"))
}

/// Переносит профиль из портативной `ServoData` в AppData.
pub fn migrate_legacy_profile() {
    let Some(root) = app_data_dir() else {
        return;
    };

    let target = root.join("EBWebView");
    if target.exists() {
        return;
    }

    let Some(exe_dir) = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(Path::to_path_buf))
    else {
        return;
    };

    let legacy_root = exe_dir.join("ServoData");
    let legacy = legacy_root.join("EBWebView");
    if !legacy.is_dir() {
        return;
    }

    if fs::create_dir_all(&root).is_err() {
        return;
    }

    // На одном диске достаточно переименования; при переносе между дисками
    // rename не сработает, поэтому копируем вручную.
    if fs::rename(&legacy, &target).is_err() && copy_dir(&legacy, &target).is_err() {
        return;
    }

    // Старая папка больше не нужна: удаляем, только если она опустела.
    let _ = fs::remove_dir(&legacy_root);
}

fn copy_dir(from: &Path, to: &Path) -> std::io::Result<()> {
    fs::create_dir_all(to)?;

    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let destination = to.join(entry.file_name());

        if kind.is_dir() {
            copy_dir(&entry.path(), &destination)?;
        } else {
            fs::copy(entry.path(), &destination)?;
        }
    }

    Ok(())
}
