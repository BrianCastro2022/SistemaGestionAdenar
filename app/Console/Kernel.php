<?php

namespace App\Console;

use App\Console\Commands\ScrapeGlossaryCommand;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Scraping del glosario - diariamente a las 2:00 AM
        $schedule->command(ScrapeGlossaryCommand::class)
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('Glossary scraping failed');
            })
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('Glossary scraping completed successfully');
            });

        // Otros comandos existentes pueden ir aquí
        $schedule->command('seguridad:revisar-calibraciones')
            ->everyFiveMinutes()
            ->withoutOverlapping();

        $schedule->command('seguridad:recordatorios-pruebas-programadas')
            ->dailyAt('09:00')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
