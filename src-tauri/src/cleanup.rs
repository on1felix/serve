//! Чистка данных WebView2, которые Servo не нужны.
//!
//! WebView2 создаёт в профиле десятки мегабайт служебных компонентов
//! (Widevine, фильтры рекламы, словари, шейдерные кэши), хотя приложению
//! нужны только localStorage (язык и кэш ответов ИИ) и пара служебных
//! файлов. Чистим тяжёлые папки при старте и выходе: в этот момент файлы
//! не заняты, а размер профиля остаётся в пределах нескольких мегабайт.

use std::path::{Path, PathBuf};

/// Папки внутри `EBWebView`, которые можно удалять без потери настроек.
const HEAVY_DIRS: &[&str] = &[
    // Компоненты, которые WebView2 копирует/скачивает сам.
    "WidevineCdm",
    "Subresource Filter",
    "Speech Recognition",
    "component_crx_cache",
    "extensions_crx_cache",
    "hyphen-data",
    "MEIPreload",
    "PKIMetadata",
    // Кэши GPU и сети.
    "GrShaderCache",
    "ShaderCache",
    "GPUPersistentCache",
    "Default/Cache",
    "Default/Code Cache",
    "Default/GPUCache",
    "Default/DawnCache",
    "Default/DawnGraphiteCache",
    "Default/DawnWebGPUCache",
    "Default/GrShaderCache",
    "Default/ShaderCache",
    "Default/Service Worker/CacheStorage",
    "Default/Service Worker/ScriptCache",
];

/// Чистит профили рядом с exe (портативная сборка) и в AppData
/// (установленная версия или старые запуски).
pub fn prune() {
    if let Some(dir) = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|parent| parent.join("ServoData")))
    {
        prune_root(&dir);
    }

    if let Some(dir) = std::env::var_os("LOCALAPPDATA").map(PathBuf::from) {
        prune_root(&dir.join("com.servo.services"));
    }
}

fn prune_root(root: &Path) {
    let webview = root.join("EBWebView");
    if !webview.is_dir() {
        return;
    }

    for relative in HEAVY_DIRS {
        let _ = std::fs::remove_dir_all(webview.join(relative));
    }
}