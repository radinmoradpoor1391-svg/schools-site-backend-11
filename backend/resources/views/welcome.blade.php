<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'سامانه مدیریت هوشمند دبیرستان دانا') }}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 2.5rem;
            border-radius: 1rem;
            text-align: center;
            max-width: 480px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        h1 { margin-top: 0; color: #6366f1; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
        .badge {
            display: inline-block;
            background: #064e3b;
            color: #34d399;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            margin-top: 1rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>سامانه مدیریت هوشمند دبیرستان دانا</h1>
        <p>بک‌اند استاندارد و امن مبتنی بر فریم‌ورک Laravel 12 و احراز هویت با Laravel Sanctum به همراه پایگاه داده متمرکز MySQL آماده سرویس‌دهی به کلاینت React می‌باشد.</p>
        <div class="badge">Laravel 12 API Active</div>
    </div>
</body>
</html>
