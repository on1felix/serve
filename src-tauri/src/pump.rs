//! Фоновый опрос служб.
//!
//! Опрос живёт в бэкенде, а не в вебвью. WebView2 считает окно скрытым, когда
//! оно теряет фокус или перекрыто другим окном, и режет таймеры JavaScript до
//! одного тика в минуту — список «замирает» до клика по окну. Поток Rust от
//! планировщика рендерера не зависит и работает одинаково всегда.
//!
//! Фронтенду остаётся рисовать: он получает событие только когда состояние
//! служб действительно изменилось, а не на каждый тик.

use std::collections::{HashMap, HashSet};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::services::{self, ServiceInfo};

/// Период перечисления служб. Один проход занимает ~10 мс, поэтому 200 мс —
/// разумный предел: реакция почти мгновенная, а процессор не в мыле.
const TICK: Duration = Duration::from_millis(200);

/// Событие с изменениями: присылаем не весь список, а только то, что
/// поменялось. Полный список — это триста служб с описаниями (сотни
/// килобайт JSON), и сериализовать его на каждое мигание службы дорого.
pub const EVENT_LIST: &str = "services-changed";
/// Событие с ошибкой перечисления: диспетчер служб недоступен.
pub const EVENT_ERROR: &str = "services-error";

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Changes {
    updated: Vec<ServiceInfo>,
    removed: Vec<String>,
}

pub fn start(app: AppHandle) {
    thread::spawn(move || {
        let mut last: Option<u64> = None;
        let mut previous: Vec<ServiceInfo> = Vec::new();
        let mut failing = false;

        loop {
            match services::list() {
                Ok(list) => {
                    failing = false;
                    let signature = signature(&list);
                    if last != Some(signature) {
                        last = Some(signature);
                        let changes = diff(&previous, &list);
                        previous = list;
                        if !changes.updated.is_empty() || !changes.removed.is_empty() {
                            let _ = app.emit(EVENT_LIST, changes);
                        }
                    }
                }
                Err(message) => {
                    // Сообщаем один раз, а не на каждом тике: если службы
                    // недоступны, это не должно заливать интерфейс ошибками.
                    if !failing {
                        failing = true;
                        let _ = app.emit(EVENT_ERROR, message);
                    }
                }
            }

            thread::sleep(TICK);
        }
    });
}

/// Что именно изменилось с прошлого прохода.
fn diff(previous: &[ServiceInfo], next: &[ServiceInfo]) -> Changes {
    let index: HashMap<&str, &ServiceInfo> = previous
        .iter()
        .map(|service| (service.name.as_str(), service))
        .collect();

    let mut updated = Vec::new();
    for service in next {
        let unchanged = index
            .get(service.name.as_str())
            .is_some_and(|old| same_service(old, service));
        if !unchanged {
            updated.push(service.clone());
        }
    }

    let names: HashSet<&str> = next.iter().map(|service| service.name.as_str()).collect();
    let removed = previous
        .iter()
        .filter(|service| !names.contains(service.name.as_str()))
        .map(|service| service.name.clone())
        .collect();

    Changes { updated, removed }
}

fn same_service(a: &ServiceInfo, b: &ServiceInfo) -> bool {
    a.name == b.name
        && a.display_name == b.display_name
        && a.description == b.description
        && a.status == b.status
        && a.start_type == b.start_type
        && a.delayed == b.delayed
        && a.pid == b.pid
        && a.can_stop == b.can_stop
        && a.can_change == b.can_change
        && a.is_system == b.is_system
        && a.is_critical == b.is_critical
        && a.verdict == b.verdict
        && a.note == b.note
        && a.note_en == b.note_en
        && a.binary_path == b.binary_path
        && a.account == b.account
}

/// Отпечаток списка: всё, что видно в интерфейсе. Сравнивать сами списки
/// дороже — триста служб с описаниями и путями.
fn signature(list: &[ServiceInfo]) -> u64 {
    let mut hasher = DefaultHasher::new();
    list.len().hash(&mut hasher);
    for service in list {
        service.name.hash(&mut hasher);
        service.display_name.hash(&mut hasher);
        service.status.hash(&mut hasher);
        service.pid.hash(&mut hasher);
        service.start_type.hash(&mut hasher);
        service.delayed.hash(&mut hasher);
        service.can_stop.hash(&mut hasher);
        service.can_change.hash(&mut hasher);
        service.is_system.hash(&mut hasher);
        service.is_critical.hash(&mut hasher);
        service.verdict.hash(&mut hasher);
        service.description.hash(&mut hasher);
        service.binary_path.hash(&mut hasher);
        service.account.hash(&mut hasher);
    }
    hasher.finish()
}