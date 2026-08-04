<?php

<<<<<<< HEAD
namespace Database\Seeders;

use App\Models\Seguridad\GlossaryTerm;
use Illuminate\Database\Seeder;

class GlossarySeeder extends Seeder
{
    public function run(): void
    {
        $terms = [
            // Categoría: SEÑALIZACIÓN DE LA VÍA
            [
                'nombre' => 'Señalización horizontal',
                'definicion' => 'Corresponde a la aplicación de marcas viales, conformadas por líneas, flechas, símbolos y letras que se pintan sobre el pavimento, bordillos o sardineles y estructuras de las vías de circulación o adyacentes a ellas.',
                'categoria' => 'SEÑALIZACIÓN DE LA VÍA',
                'pregunta_numero' => '2.1',
                'source' => 'manual',
            ],
            [
                'nombre' => 'Señalización Vertical',
                'definicion' => 'Toda señal instalada al costado o sobre el camino. La señalización vertical es representada a través de placas fijadas en postes o estructuras que son instaladas sobre el pavimento o la calzada de una vía.',
                'categoria' => 'SEÑALIZACIÓN DE LA VÍA',
                'pregunta_numero' => '2.2',
                'source' => 'manual',
            ],
            [
                'nombre' => 'Señalización Vertical: Reglamentarias o Regulatorias',
                'definicion' => 'Son las encargadas de notificar a los usuarios sobre las restricciones, prohibiciones y obligaciones que existen en una vía.',
                'categoria' => 'SEÑALIZACIÓN DE LA VÍA',
                'pregunta_numero' => '2.3',
                'source' => 'manual',
            ],
            [
                'nombre' => 'Señalización Vertical: Preventivas',
                'definicion' => 'Son responsables de advertir a los usuarios la existencia de riesgos y/o situaciones de peligro dentro de una vía. Pueden ser utilizadas de manera temporal o permanente.',
                'categoria' => 'SEÑALIZACIÓN DE LA VÍA',
                'pregunta_numero' => '2.4',
                'source' => 'manual',
            ],
            [
                'nombre' => 'Señalización Vertical: Informativas',
                'definicion' => 'Estas señales tienen la finalidad de orientar a los usuarios de una vía con información que los guíe de manera segura hacia sus destinos.',
                'categoria' => 'SEÑALIZACIÓN DE LA VÍA',
                'pregunta_numero' => '2.5',
                'source' => 'manual',
            ],
        ];

        foreach ($terms as $term) {
            GlossaryTerm::create($term);
        }

        $this->command->info('Glosario de términos inicializado exitosamente.');
    }
}

