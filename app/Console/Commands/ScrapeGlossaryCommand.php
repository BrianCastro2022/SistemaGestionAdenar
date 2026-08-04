<?php

namespace App\Console\Commands;

use App\Models\Seguridad\GlossaryTerm;
use App\Models\Seguridad\WebScrapingSource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;

class ScrapeGlossaryCommand extends Command
{
    protected $signature = 'glossary:scrape {--source= : ID o nombre de una fuente específica}';

    protected $description = 'Descarga y sincroniza términos del glosario desde las fuentes web configuradas';

    public function handle(): int
    {
        $query = WebScrapingSource::active();

        if ($sourceOption = $this->option('source')) {
            $query->where(function ($q) use ($sourceOption) {
                $q->where('id', $sourceOption)->orWhere('nombre_fuente', $sourceOption);
            });
        }

        $sources = $query->get();

        if ($sources->isEmpty()) {
            $this->warn('No hay fuentes web activas configuradas.');

            return self::SUCCESS;
        }

        $inserted = 0;
        $updated = 0;
        $errors = 0;

        foreach ($sources as $source) {
            $this->info("Procesando fuente: {$source->nombre_fuente} ({$source->url})");

            try {
                $response = Http::timeout(30)
                    ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; AdenarGlossaryBot/1.0)'])
                    ->get($source->url);

                if (! $response->successful()) {
                    throw new \RuntimeException("HTTP {$response->status()}");
                }

                $crawler = new Crawler($response->body(), $source->url);
                $elements = $crawler->filter($source->selector_css);

                if ($elements->count() === 0) {
                    $this->warn("No se encontraron elementos con el selector CSS '{$source->selector_css}'.");
                    continue;
                }

                $elements->each(function (Crawler $node) use ($source, &$inserted, &$updated, &$errors) {
                    try {
                        $nombre = trim($node->text(''));

                        // Toma el texto completo del elemento hermano siguiente
                        // (normalmente un <div class="termino">), sin importar
                        // si la definición está en uno o varios <p> anidados.
                        $definicion = null;
                        $sibling = $node->getNode(0)->nextSibling;

                        while ($sibling !== null) {
                            if ($sibling->nodeType === XML_ELEMENT_NODE) {
                                $definicion = trim($sibling->textContent);
                                $definicion = preg_replace('/[\x{00A0}\s]+/u', ' ', $definicion);
                                $definicion = trim($definicion);
                                break;
                            }
                            $sibling = $sibling->nextSibling;
                        }

                        if ($nombre === '' || $definicion === null || $definicion === '') {
                            return;
                        }

                        $existing = GlossaryTerm::withTrashed()
                            ->where('nombre', $nombre)
                            ->where('categoria', $source->categoria)
                            ->first();

                        if ($existing) {
                            if ($existing->isManual()) {
                                return;
                            }

                            $changed = $existing->definicion !== $definicion;

                            if ($changed) {
                                $existing->update([
                                    'definicion' => $definicion,
                                ]);
                                $updated++;
                            }
                        } else {
                            GlossaryTerm::create([
                                'nombre' => $nombre,
                                'definicion' => $definicion,
                                'representacion' => null,
                                'categoria' => $source->categoria,
                                'source' => 'scraped',
                            ]);
                            $inserted++;
                        }
                    } catch (\Throwable $e) {
                        $errors++;
                        Log::error("Error procesando término de {$source->nombre_fuente}: {$e->getMessage()}");
                    }
                });

                $source->update(['ultimo_scrape' => now()]);
            } catch (\Throwable $e) {
                $errors++;
                $this->error("Error descargando {$source->url}: {$e->getMessage()}");
                Log::error("Error en scraping de {$source->nombre_fuente}: {$e->getMessage()}");
            }
        }

        $this->info("Scraping completado: Insertados={$inserted}, Actualizados={$updated}, Errores={$errors}");
        Log::info("Glossary scraping completed: Inserted={$inserted}, Updated={$updated}, Errors={$errors}");

        return self::SUCCESS;
    }
}
