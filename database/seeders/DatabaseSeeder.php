<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(GlossarySeeder::class);

        $demoUsers = [
            ['id_number' => '1000000001', 'first' => 'Ana', 'last' => 'Administradora', 'role' => RoleEnum::Administrador],
            ['id_number' => '1000000002', 'first' => 'Samuel', 'last' => 'Seguridad', 'role' => RoleEnum::Seguridad],
            ['id_number' => '1000000003', 'first' => 'Rita', 'last' => 'Reparto', 'role' => RoleEnum::Reparto],
            ['id_number' => '1000000004', 'first' => 'Gina', 'last' => 'Gente', 'role' => RoleEnum::Gente],
            ['id_number' => '1000000005', 'first' => 'Felipe', 'last' => 'Flota', 'role' => RoleEnum::Flota],
        ];

        foreach ($demoUsers as $demo) {
            $user = User::factory()->create([
                'first_name' => $demo['first'],
                'last_name' => $demo['last'],
                'identification_number' => $demo['id_number'],
                'email' => strtolower("{$demo['first']}@adenar.test"),
                'password' => 'password',
                'is_active' => true,
            ]);

            $user->assignRole($demo['role']->value);
        }
    }
}
