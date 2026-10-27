//! Небольшая база знаний о службах Windows.
//!
//! Windows отдаёт собственное описание службы, но оно есть не у всех
//! (особенно у новых и сторонних служб), поэтому здесь лежит короткий
//! человеческий комментарий и оценка риска:
//!
//! * `safe`     — можно отключать без последствий для системы;
//! * `caution`  — можно, но что-то перестанет работать;
//! * `critical` — отключение ломает Windows, кнопка блокируется;
//! * `unknown`  — данных нет, решайте сами.

pub fn meta(name: &str) -> (&'static str, &'static str) {
    match name {
        // ── Безопасно отключать ──────────────────────────────────────────
        "DiagTrack" => (
            "safe",
            "Телеметрия Microsoft: собирает статистику использования и отправляет её на серверы. На работу системы не влияет.",
        ),
        "dmwappushservice" => (
            "safe",
            "Маршрутизация push-сообщений WAP — часть старого механизма телеметрии. Не нужна обычному ПК.",
        ),
        "MapsBroker" => (
            "safe",
            "Скачивание офлайн-карт для приложения «Карты». Если картами не пользуетесь — смело отключайте.",
        ),
        "lfsvc" => (
            "safe",
            "Геолокация Windows. Нужна только приложениям, которые определяют ваше местоположение.",
        ),
        "PcaSvc" => (
            "safe",
            "Помощник совместимости: показывает подсказки «эта программа может работать неправильно». Без него Windows работает штатно.",
        ),
        "WerSvc" => (
            "safe",
            "Служба регистрации ошибок: собирает и отправляет отчёты о падениях программ в Microsoft. Отключение ничего не ломает.",
        ),
        "wercplsupport" => (
            "safe",
            "Поддержка раздела «Отчёты о проблемах» в панели управления — связана с предыдущей службой.",
        ),
        "SEMgrSvc" => (
            "safe",
            "Платежи и NFC/защищённые элементы. Нужна только для оплаты через Windows и чтения смарт-карт.",
        ),
        "WalletService" => (
            "safe",
            "Служба кошелька Windows. Не используется обычными программами.",
        ),
        "RetailDemo" => (
            "safe",
            "Демонстрационный режим для витрин магазинов. Домашнему ПК не нужна.",
        ),
        "WMPNetworkSvc" => (
            "safe",
            "Общий доступ к медиатеке Windows Media Player по сети (DLNA). Если не транслируете музыку на телевизор — не нужна.",
        ),
        "WebClient" => (
            "safe",
            "Веб-клиент (WebDAV): подключение сетевых папок по HTTP. Используется крайне редко.",
        ),
        "SNMPTrap" => (
            "safe",
            "Ловушка SNMP — отправка событий на системы сетевого мониторинга. Дома не нужна.",
        ),
        "RpcLocator" => (
            "safe",
            "Локатор RPC — устаревшая служба для очень старых сетевых приложений.",
        ),
        "SCardSvr" => (
            "safe",
            "Смарт-карты. Нужна только при наличии считывателя смарт-карт.",
        ),
        "TapiSrv" => (
            "caution",
            "Телефония (TAPI). Может понадобиться старым программам для звонков и факса.",
        ),
        "PhoneSvc" => (
            "safe",
            "Телефонная связь Windows — базовая телефония, факс. Обычному ПК не нужна.",
        ),
        "WwanSvc" => (
            "safe",
            "Поддержка сотовых модемов (4G/LTE). Если такого модема нет — отключайте.",
        ),
        "autotimesvc" => (
            "safe",
            "Синхронизация времени через сеть сотовой связи. Для ПК с интернетом бесполезна.",
        ),
        "ZTHELPER" => (
            "caution",
            "Вспомогательная служба ZTDNS — компонент сетевого ПО. Отключайте, если не уверены, что оно вам нужно.",
        ),
        "WpcMonSvc" => (
            "safe",
            "Родительский контроль. Если он не настроен — не нужна.",
        ),
        "Fax" => (
            "safe",
            "Отправка и приём факсов. В 2026 году нужна единицам.",
        ),
        "icssvc" => (
            "safe",
            "Мобильный хот-спот Windows (раздача Wi-Fi с ПК). Если не раздаёте интернет — не нужна.",
        ),
        "FvSvc" => (
            "safe",
            "NVIDIA FrameView SDK — сбор статистики FPS для оверлея. Запись ShadowPlay работает и без неё.",
        ),
        "ssh-agent" => (
            "safe",
            "Агент SSH-ключей. Нужен только если пользуетесь OpenSSH с ключами.",
        ),
        "RemoteRegistry" => (
            "safe",
            "Удалённый реестр: позволяет менять реестр с другого компьютера. Дома это не нужно и небезопасно.",
        ),
        "NvTelemetryContainer" => (
            "safe",
            "Телеметрия NVIDIA. На работу драйвера и игр не влияет.",
        ),

        // ── Bluetooth ────────────────────────────────────────────────────
        "bthserv" => (
            "caution",
            "Поддержка Bluetooth. Отключайте, только если Bluetooth-адаптера нет или он не используется.",
        ),
        "BTAGService" => (
            "caution",
            "Звуковой шлюз Bluetooth — нужен для Bluetooth-наушников и гарнитур.",
        ),
        "BthAvctpSvc" => (
            "caution",
            "Профиль AVCTP — управление воспроизведением с Bluetooth-устройств.",
        ),

        // ── Xbox ─────────────────────────────────────────────────────────
        "XboxService" => (
            "caution",
            "Xbox-приложение, Game Pass и оверлей Win+G. Игры из Steam/Epic работают без неё.",
        ),
        "XblAuthManager" => (
            "caution",
            "Авторизация Xbox Live. Нужна только играм с Xbox Live и приложению Xbox.",
        ),
        "XblGameSave" => (
            "caution",
            "Облачные сохранения Xbox Live. Без неё сохранения не будут синхронизироваться.",
        ),
        "XboxNetApiSvc" => (
            "caution",
            "Сетевая служба Xbox Live — сетевые функции игр Xbox/Game Pass.",
        ),
        "XboxGipSvc" => (
            "caution",
            "Поддержка геймпадов Xbox. Отключайте, только если не подключаете геймпад.",
        ),

        // ── Удалённый доступ ─────────────────────────────────────────────
        "TermService" => (
            "caution",
            "Удалённый рабочий стол (RDP): вход на этот ПК по сети. Если не используете RDP — можно отключить, но не удаляйте, если нужен AnyDesk/TeamViewer (они работают и без неё).",
        ),
        "UmRdpService" => (
            "caution",
            "Перенаправление портов для RDP. Нужна только вместе со службой удалённых рабочих столов.",
        ),
        "SessionEnv" => (
            "caution",
            "Настройка сервера удалённых рабочих столов. Для домашнего ПК обычно не нужна.",
        ),
        "SharedAccess" => (
            "caution",
            "Общий доступ к интернету (ICS): раздача интернета другим устройствам с этого ПК. Если не раздаёте — можно отключить.",
        ),

        // ── Печать, поиск, производительность ────────────────────────────
        "Spooler" => (
            "caution",
            "Диспетчер печати. Нужен для принтеров и для «Печать в PDF». Отключайте, только если точно не печатаете.",
        ),
        "WSearch" => (
            "caution",
            "Индексация файлов для быстрого поиска в Проводнике и меню «Пуск». Отключение замедлит поиск, но систему не сломает.",
        ),
        "SysMain" => (
            "caution",
            "Предзагрузка часто используемых программ в память. На SSD с большим объёмом ОЗУ польза минимальна, но и вреда нет.",
        ),
        "DoSvc" => (
            "caution",
            "Оптимизация доставки обновлений (P2P). Можно отключить, чтобы не отдавать трафик другим ПК; обновления продолжат работать.",
        ),

        // ── Сторонние службы ─────────────────────────────────────────────
        "GamingServices" => (
            "caution",
            "Служба игр Microsoft Store / Game Pass. Нужна для установки и запуска игр из Store.",
        ),
        "GamingServicesNet" => (
            "caution",
            "Сетевая часть Gaming Services. Вместе с предыдущей службой.",
        ),
        "Steam Client Service" => (
            "caution",
            "Служба Steam — нужна для запуска клиента и обновлений игр.",
        ),
        "EasyAntiCheat" => (
            "caution",
            "Античит Easy Anti-Cheat. Без неё не запустятся защищённые онлайн-игры.",
        ),
        "EasyAntiCheat_EOS" => (
            "caution",
            "Easy Anti-Cheat для Epic Online Services. Нужна соответствующим играм.",
        ),
        "Rockstar Service" => (
            "caution",
            "Служба Rockstar Games Launcher — запуск и обновление игр Rockstar.",
        ),
        "RvControlSvc" => (
            "caution",
            "Radmin VPN — виртуальная сеть. Отключайте, если не пользуетесь.",
        ),
        "CloudflareWARP" => (
            "caution",
            "Cloudflare One Client (WARP) — VPN/защищённый DNS. Если не пользуетесь, отключите.",
        ),
        "MBAMService" => (
            "caution",
            "Служба Malwarebytes. Отключайте, только если удаляете антивирус.",
        ),
        "MBVpnTunnelService" => (
            "caution",
            "VPN-туннель Malwarebytes. Нужен только при использовании их VPN.",
        ),
        "NvContainerLocalSystem" => (
            "caution",
            "Контейнер NVIDIA: ShadowPlay, оверлей, обновления. Нужен для записи и функций NVIDIA App.",
        ),
        "NVDisplay.ContainerLocalSystem" => (
            "caution",
            "Служба панели NVIDIA — настройки дисплея, G-Sync, цвет. Лучше не отключать.",
        ),
        "nvagent" => (
            "caution",
            "Агент NVIDIA — часть драйвера. Оставьте включённой.",
        ),
        "NPSMSvc_9559b" => (
            "caution",
            "Пользовательская служба Windows (медиа/уведомления). Трогать не нужно.",
        ),
        "PCManager Service Store" => (
            "caution",
            "Microsoft PC Manager — утилита очистки и ускорения. Нужна, только если вы ей пользуетесь.",
        ),
        "GoogleUpdaterService157.0.8089.0" => (
            "caution",
            "Обновление Google Chrome. Лучше оставить: через неё приходят обновления безопасности браузера.",
        ),
        "GoogleUpdaterInternalService157.0.8089.0" => (
            "caution",
            "Внутренняя часть обновления Chrome. Оставьте включённой.",
        ),
        "GoogleChromeElevationService" => (
            "caution",
            "Повышение прав Chrome для обновлений. Можно оставить.",
        ),
        "CoworkVMService" => (
            "caution",
            "Виртуальная машина Claude. Нужна для работы Claude на этом ПК.",
        ),
        "AnyDesk" => (
            "caution",
            "AnyDesk — удалённый доступ. Отключайте, если не пользуетесь.",
        ),
        "hns" => (
            "caution",
            "Сеть узлов Hyper-V. Нужна виртуальным машинам, WSL2 и Claude VM.",
        ),
        "vmcompute" => (
            "caution",
            "Вычислительная служба Hyper-V. Нужна виртуальным машинам и WSL2.",
        ),

        // ── Критические службы ───────────────────────────────────────────
        "RpcSs" => ("critical", "Ядро RPC: без неё не запускается почти ничего."),
        "DcomLaunch" => ("critical", "Запуск DCOM-серверов — основа работы Windows."),
        "RpcEptMapper" => ("critical", "Сопоставитель конечных точек RPC."),
        "Power" => ("critical", "Управление питанием и энергосбережением."),
        "PlugPlay" => ("critical", "Подключение и работа всех устройств."),
        "EventLog" => ("critical", "Журнал событий Windows."),
        "Schedule" => ("critical", "Планировщик заданий: обновления, обслуживание, задачи программ."),
        "ProfSvc" => ("critical", "Профили пользователей."),
        "UserManager" => ("critical", "Диспетчер пользователей — вход в систему."),
        "Themes" => ("critical", "Оформление окон и панелей."),
        "AudioSrv" => ("critical", "Звук Windows."),
        "AudioEndpointBuilder" => ("critical", "Устройства воспроизведения и записи звука."),
        "Dhcp" => ("critical", "Получение IP-адреса по DHCP."),
        "Dnscache" => ("critical", "Кэш DNS — без неё не открываются сайты."),
        "nsi" => ("critical", "Служба сетевого интерфейса."),
        "netprofm" => ("critical", "Определение сетевых подключений."),
        "NlaSvc" => ("critical", "Сведения о сети и её доступности."),
        "Wcmsvc" => ("critical", "Управление подключениями Windows."),
        "WlanSvc" => ("critical", "Wi-Fi."),
        "LanmanWorkstation" => ("critical", "Доступ к сетевым папкам."),
        "LanmanServer" => ("critical", "Общий доступ к файлам и принтерам."),
        "SamSs" => ("critical", "Диспетчер учётных записей безопасности."),
        "CryptSvc" => ("critical", "Криптография: сертификаты, HTTPS, подписи."),
        "Winmgmt" => ("critical", "Инструментарий управления Windows (WMI)."),
        "gpsvc" => ("critical", "Групповые политики."),
        "SENS" => ("critical", "Уведомления о системных событиях."),
        "SystemEventsBroker" => ("critical", "Брокер системных событий."),
        "BrokerInfrastructure" => ("critical", "Инфраструктура фоновых задач."),
        "StateRepository" => ("critical", "Хранилище состояния приложений и служб."),
        "TextInputManagementService" => ("critical", "Ввод текста и раскладки клавиатуры."),
        "ShellHWDetection" => ("critical", "Обнаружение съёмных устройств."),
        "WinDefend" => ("critical", "Антивирус Microsoft Defender."),
        "MDCoreSvc" => ("critical", "Ядро Microsoft Defender."),
        "mpssvc" => ("critical", "Брандмауэр Windows."),
        "BFE" => ("critical", "Служба фильтрации — движок брандмауэра."),
        "wscsvc" => ("critical", "Центр безопасности Windows."),
        "SecurityHealthService" => ("critical", "Безопасность Windows."),
        "CoreMessagingRegistrar" => ("critical", "Обмен сообщениями между компонентами системы."),
        "EventSystem" => ("critical", "Система событий COM+."),
        "TimeBrokerSvc" => ("critical", "Планирование фоновых задач по времени."),
        "DsmSvc" => ("critical", "Установка и настройка устройств."),
        "AppXSvc" => ("critical", "Развёртывание приложений Microsoft Store."),
        "TokenBroker" => ("critical", "Токены входа в учётные записи."),
        "VaultSvc" => ("critical", "Хранилище учётных данных."),
        "KeyIso" => ("critical", "Изоляция ключей CNG."),
        "LSM" => ("critical", "Диспетчер сеансов служб."),
        "DeviceAssociationService" => ("critical", "Сопоставление устройств."),
        "DisplayEnhancementService" => ("critical", "Управление яркостью и цветом экрана."),
        "hidserv" => ("critical", "Доступ к HID-устройствам (клавиатура, мышь)."),
        "TrustedInstaller" => ("critical", "Установщик модулей Windows."),
        "wuauserv" => ("critical", "Центр обновления Windows."),
        "BITS" => ("critical", "Фоновая загрузка обновлений и файлов."),
        "UsoSvc" => ("critical", "Оркестратор обновлений."),
        "WaaSMedicSvc" => ("critical", "Служба лечения обновлений."),
        "sppsvc" => ("critical", "Активация лицензии Windows."),
        "LicenseManager" => ("critical", "Менеджер лицензий Store."),
        "ClipSVC" => ("critical", "Служба лицензий клиента."),
        "InstallService" => ("critical", "Установка приложений Microsoft Store."),
        "W32Time" => ("caution", "Синхронизация времени. Отключение может сбить время и сертификаты."),
        "DusmSvc" => ("critical", "Учёт использования сети и трафика."),
        "DPS" => ("critical", "Диагностическая политика."),
        "WdiSystemHost" => ("critical", "Диагностика системы."),
        "WdiServiceHost" => ("critical", "Диагностика служб."),
        "camsvc" => ("critical", "Доступ приложений к камере."),
        "DeviceInstall" => ("critical", "Установка устройств."),
        "Appinfo" => ("caution", "Запуск приложений с правами администратора (UAC)."),
        "AppReadiness" => ("caution", "Подготовка приложений к первому запуску."),
        "NgcSvc" => ("critical", "Microsoft Passport / Windows Hello."),
        "NgcCtnrSvc" => ("critical", "Контейнер Microsoft Passport."),

        _ => ("unknown", ""),
    }
}

/// Службы, у которых кнопка «Отключить» заблокирована полностью.
pub fn critical_list() -> &'static [&'static str] {
    &[
        "RpcSs",
        "DcomLaunch",
        "RpcEptMapper",
        "Power",
        "PlugPlay",
        "EventLog",
        "Schedule",
        "ProfSvc",
        "UserManager",
        "Themes",
        "AudioSrv",
        "AudioEndpointBuilder",
        "Dhcp",
        "Dnscache",
        "nsi",
        "netprofm",
        "NlaSvc",
        "Wcmsvc",
        "WlanSvc",
        "LanmanWorkstation",
        "LanmanServer",
        "SamSs",
        "CryptSvc",
        "Winmgmt",
        "gpsvc",
        "SENS",
        "SystemEventsBroker",
        "BrokerInfrastructure",
        "StateRepository",
        "TextInputManagementService",
        "ShellHWDetection",
        "WinDefend",
        "MDCoreSvc",
        "mpssvc",
        "BFE",
        "wscsvc",
        "SecurityHealthService",
        "CoreMessagingRegistrar",
        "EventSystem",
        "TimeBrokerSvc",
        "DsmSvc",
        "AppXSvc",
        "TokenBroker",
        "VaultSvc",
        "KeyIso",
        "LSM",
        "DeviceAssociationService",
        "DisplayEnhancementService",
        "hidserv",
        "TrustedInstaller",
        "wuauserv",
        "BITS",
        "UsoSvc",
        "WaaSMedicSvc",
        "sppsvc",
        "LicenseManager",
        "ClipSVC",
        "InstallService",
        "DusmSvc",
        "DPS",
        "WdiSystemHost",
        "WdiServiceHost",
        "camsvc",
        "DeviceInstall",
        "NgcSvc",
        "NgcCtnrSvc",
        "AppXSvc",
        "ProfSvc",
        "CoreMessagingRegistrar",
    ]
}

pub fn is_critical(name: &str) -> bool {
    critical_list().iter().any(|n| n.eq_ignore_ascii_case(name))
}
