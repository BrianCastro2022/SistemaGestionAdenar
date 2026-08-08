<?php

namespace App\Http\Controllers\Seguridad;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seguridad\StoreColaboradorRequest;
use App\Http\Requests\Seguridad\UpdateColaboradorPaso1Request;
use App\Http\Requests\Seguridad\UpdateColaboradorPaso2Request;
use App\Http\Requests\Seguridad\UpdateColaboradorPaso3Request;
use App\Http\Requests\Seguridad\UpdateColaboradorPaso4Request;
use App\Http\Requests\Seguridad\UpdateColaboradorRequest;
use App\Models\Seguridad\Colaborador;
use App\Models\Seguridad\Entrenamiento;
use App\Models\User;
use App\Services\Seguridad\CargoHistorialService;
use App\Services\Seguridad\IndiceRiesgoCalculator;
use App\Support\Seguridad\ColaboradorDocumentoCampos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ColaboradorController extends Controller
{
    /**
     * HU05/HU06: columnas y filtros exactos del PDF. `registro` controla
     * borrador/completo (antes vivía en el parámetro `estado`); `estado`
     * ahora significa lo que pide HU06: Activo/Inactivo/Todos.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $registro = $request->string('registro')->trim()->toString();
        $estado = $request->string('estado')->trim()->toString();
        $area = $request->string('area')->trim()->toString();
        $cargo = $request->string('cargo')->trim()->toString();
        $centro = $request->string('centro')->trim()->toString();
        $tipoContrato = $request->string('tipo_contrato')->trim()->toString();
        $eps = $request->string('eps')->trim()->toString();
        $arl = $request->string('arl')->trim()->toString();
        $fechaIngresoDesde = $request->string('fecha_ingreso_desde')->trim()->toString();
        $fechaIngresoHasta = $request->string('fecha_ingreso_hasta')->trim()->toString();
        $vencimientoContrato = $request->string('vencimiento_contrato')->trim()->toString();

        // Mismo umbral que la alerta de HU03, para que "próximos a vencer"
        // signifique lo mismo en la alerta y en este filtro.
        $limiteProximoVencer = now()->addDays((int) config('seguridad.dias_alerta_vencimiento_contrato'));

        $colaboradores = Colaborador::query()
            ->select([
                'id', 'cedula', 'nombres', 'apellidos', 'area', 'cargo', 'centro',
                'celular_1', 'codigo_qr_skap', 'correo', 'direccion', 'centro_trabajo',
                'eps', 'eps_otro', 'arl', 'arl_otro', 'fecha_ingreso_empresa', 'tipo_padrino',
                'imagen', 'is_active', 'estado_registro', 'wizard_step',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('cedula', 'like', "%{$search}%");
                });
            })
            ->when(
                $registro === 'borrador',
                fn ($query) => $query->where('estado_registro', 'borrador'),
                fn ($query) => $query->when($registro !== 'todos', fn ($query) => $query->completos())
            )
            ->when($estado === 'activo', fn ($query) => $query->where('is_active', true))
            ->when($estado === 'inactivo', fn ($query) => $query->where('is_active', false))
            ->when($area !== '', fn ($query) => $query->where('area', $area))
            ->when($cargo !== '', fn ($query) => $query->where('cargo', $cargo))
            ->when($centro !== '', fn ($query) => $query->where('centro', $centro))
            ->when($tipoContrato !== '', fn ($query) => $query->where('tipo_contrato', $tipoContrato))
            ->when($eps !== '', fn ($query) => $query->where('eps', $eps))
            ->when($arl !== '', fn ($query) => $query->where('arl', $arl))
            ->when($fechaIngresoDesde !== '', fn ($query) => $query->whereDate('fecha_ingreso_empresa', '>=', $fechaIngresoDesde))
            ->when($fechaIngresoHasta !== '', fn ($query) => $query->whereDate('fecha_ingreso_empresa', '<=', $fechaIngresoHasta))
            ->when($vencimientoContrato === 'vencidos', fn ($query) => $query->whereNotNull('contrato_fecha_hasta')->where('contrato_fecha_hasta', '<', now()))
            ->when($vencimientoContrato === 'proximos', fn ($query) => $query->whereNotNull('contrato_fecha_hasta')->whereBetween('contrato_fecha_hasta', [now(), $limiteProximoVencer]))
            ->when($vencimientoContrato === 'vigentes', fn ($query) => $query->where(function ($query) use ($limiteProximoVencer) {
                $query->whereNull('contrato_fecha_hasta')->orWhere('contrato_fecha_hasta', '>', $limiteProximoVencer);
            }))
            ->orderBy('nombres')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('seguridad/colaboradores/index', [
            'colaboradores' => $colaboradores,
            'filters' => [
                'search' => $search,
                'registro' => $registro,
                'estado' => $estado,
                'area' => $area,
                'cargo' => $cargo,
                'centro' => $centro,
                'tipo_contrato' => $tipoContrato,
                'eps' => $eps,
                'arl' => $arl,
                'fecha_ingreso_desde' => $fechaIngresoDesde,
                'fecha_ingreso_hasta' => $fechaIngresoHasta,
                'vencimiento_contrato' => $vencimientoContrato,
            ],
            'borradoresCount' => Colaborador::where('estado_registro', 'borrador')->count(),
            'catalogos' => $this->catalogos(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('seguridad/colaboradores/wizard/index', [
            'colaborador' => null,
            'currentStep' => 1,
            'catalogos' => $this->catalogos(),
        ]);
    }

    /**
     * Paso 1 del wizard: crea el colaborador como borrador. Los pasos
     * siguientes se completan sobre este mismo registro vía wizard().
     */
    public function store(StoreColaboradorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (ColaboradorDocumentoCampos::PASO1 as $field) {
            unset($data[$field]);
        }

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $request->file('imagen')->store('colaboradores', 'public');
        }

        if (empty($data['user_id'])) {
            $data['user_id'] = $this->autoprovisionarUsuario($data['cedula'], $data['nombres'], $data['apellidos'], $data['correo'] ?? null)->id;
        }

        $colaborador = Colaborador::create([
            ...$data,
            'is_active' => $request->boolean('is_active', true),
            'estado_registro' => 'borrador',
            'wizard_step' => 1,
        ]);

        $this->storeDocuments($request, $colaborador, ColaboradorDocumentoCampos::PASO1);

        return to_route('seguridad.colaboradores.wizard', $colaborador);
    }

    /**
     * Muestra el wizard sobre un colaborador ya existente: retoma un
     * borrador donde se quedó, o permite revisar cualquier paso ya guardado.
     */
    public function wizard(Request $request, Colaborador $colaborador): Response
    {
        $maxStep = max(1, (int) $colaborador->wizard_step);
        $siguienteStep = min($maxStep + 1, 4);
        $currentStep = min(max((int) $request->integer('paso', $siguienteStep), 1), 4);

        $colaboradorData = $colaborador->toArray();
        $colaboradorData = [...$colaboradorData, ...$this->documentPaths($colaborador)];

        return Inertia::render('seguridad/colaboradores/wizard/index', [
            'colaborador' => $colaboradorData,
            'currentStep' => $currentStep,
            'catalogos' => $this->catalogos(),
            'historialCargos' => $colaborador->cargos()->orderByDesc('fecha_inicio')->get(),
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function catalogos(): array
    {
        return [
            'tiposDocumento' => config('seguridad.colaboradores.tipos_documento'),
            'epsOpciones' => config('seguridad.colaboradores.eps_opciones'),
            'afpOpciones' => config('seguridad.colaboradores.afp_opciones'),
            'arlOpciones' => config('seguridad.colaboradores.arl_opciones'),
            'cargos' => config('seguridad.colaboradores.cargos'),
            'centros' => config('seguridad.colaboradores.centros'),
            'centrosTrabajo' => config('seguridad.colaboradores.centros_trabajo'),
            'tiposContrato' => config('seguridad.colaboradores.tipos_contrato'),
            'motivosRetiro' => config('seguridad.colaboradores.motivos_retiro'),
            'licenciaCategorias' => config('seguridad.colaboradores.licencia_conduccion_categorias'),
        ];
    }

    public function updatePaso1(UpdateColaboradorPaso1Request $request, Colaborador $colaborador): RedirectResponse
    {
        $data = $request->validated();

        foreach (ColaboradorDocumentoCampos::PASO1 as $field) {
            unset($data[$field]);
        }

        if ($request->hasFile('imagen')) {
            if ($colaborador->imagen) {
                Storage::disk('public')->delete($colaborador->imagen);
            }

            $data['imagen'] = $request->file('imagen')->store('colaboradores', 'public');
        }

        $colaborador->update([
            ...$data,
            'wizard_step' => max((int) $colaborador->wizard_step, 1),
        ]);

        $this->storeDocuments($request, $colaborador, ColaboradorDocumentoCampos::PASO1);

        return to_route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 2]);
    }

    public function updatePaso2(UpdateColaboradorPaso2Request $request, Colaborador $colaborador): RedirectResponse
    {
        $data = $request->validated();

        foreach (ColaboradorDocumentoCampos::PASO2 as $field) {
            unset($data[$field]);
        }

        $colaborador->update([
            ...$data,
            'wizard_step' => max((int) $colaborador->wizard_step, 2),
        ]);

        $this->storeDocuments($request, $colaborador, ColaboradorDocumentoCampos::PASO2);

        return to_route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 3]);
    }

    public function updatePaso3(UpdateColaboradorPaso3Request $request, Colaborador $colaborador, CargoHistorialService $cargoHistorial): RedirectResponse
    {
        $data = $request->validated();
        $cargo = $data['cargo'] ?? null;
        $cargoFechaInicio = $data['cargo_fecha_inicio'] ?? null;
        unset($data['cargo'], $data['cargo_fecha_inicio']);

        $colaborador->update([
            ...$data,
            'wizard_step' => max((int) $colaborador->wizard_step, 3),
        ]);

        if ($cargo && $cargoFechaInicio) {
            $cargoHistorial->asignar($colaborador, $cargo, $cargoFechaInicio);
        }

        return to_route('seguridad.colaboradores.wizard', ['colaborador' => $colaborador, 'paso' => 4]);
    }

    public function updatePaso4(UpdateColaboradorPaso4Request $request, Colaborador $colaborador): RedirectResponse
    {
        $data = $request->validated();

        foreach (ColaboradorDocumentoCampos::PASO4 as $field) {
            unset($data[$field]);
        }
        unset($data['licencia_conduccion_categorias']);

        $colaborador->update([
            ...$data,
            'estado_registro' => 'completo',
            'wizard_step' => 4,
        ]);

        $this->storeDocuments($request, $colaborador, ColaboradorDocumentoCampos::PASO4);

        return to_route('seguridad.colaboradores.show', $colaborador)->with('status', 'Colaborador registrado correctamente.');
    }

    public function show(Colaborador $colaborador, IndiceRiesgoCalculator $calculator): Response
    {
        $documentos = $this->documentPaths($colaborador);
        $colaboradorData = [...$colaborador->toArray(), ...$documentos];

        return Inertia::render('seguridad/colaboradores/show', [
            'colaborador' => $colaboradorData,
            'indiceRiesgo' => $calculator->calcular($colaborador),
            'pruebas' => $colaborador->pruebasAlcoholemia()
                ->with('alcoholimetro:id,codigo')
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
            'condicionesSalud' => $colaborador->condicionesSalud()
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
            'llamadosAtencion' => $colaborador->llamadosAtencion()
                ->with('registradoPor:id,name')
                ->latest('fecha_hora')
                ->limit(25)
                ->get(),
            'entrenamientos' => $colaborador->entrenamientos()
                ->with(['entrenamiento:id,nombre', 'registradoPor:id,name'])
                ->orderByDesc('fecha_registro')
                ->orderByDesc('hora_registro')
                ->limit(50)
                ->get(),
            'entrenamientosCatalogo' => Entrenamiento::orderBy('nombre')->get(['id', 'nombre']),
            'certificadosAprendizaje' => [
                'escuelaPilotos' => count($documentos['documento_escuela_pilotos'] ?? []) > 0,
                'brigadista' => count($documentos['documento_certificado_brigadista'] ?? []) > 0,
            ],
        ]);
    }

    /**
     * HU04: botón dedicado en la vista de detalle para activar/desactivar
     * al colaborador en el sistema.
     */
    public function toggleActivo(Colaborador $colaborador): RedirectResponse
    {
        $colaborador->update(['is_active' => ! $colaborador->is_active]);

        return back()->with('status', $colaborador->is_active ? 'Colaborador activado.' : 'Colaborador desactivado.');
    }

    public function edit(Colaborador $colaborador): Response
    {
        $colaboradorData = $colaborador->toArray();
        $colaboradorData = [...$colaboradorData, ...$this->documentPaths($colaborador)];

        return Inertia::render('seguridad/colaboradores/edit', [
            'colaborador' => $colaboradorData,
            'usuarios' => $this->usuariosVinculables($colaborador),
            'catalogos' => $this->catalogos(),
            'historialCargos' => $colaborador->cargos()->orderByDesc('fecha_inicio')->get(),
        ]);
    }

    public function update(UpdateColaboradorRequest $request, Colaborador $colaborador, CargoHistorialService $cargoHistorial): RedirectResponse
    {
        $data = $request->validated();

        foreach (ColaboradorDocumentoCampos::todas() as $field) {
            unset($data[$field]);
        }
        unset($data['licencia_conduccion_categorias']);

        $cargo = $data['cargo'] ?? null;
        $cargoFechaInicio = $data['cargo_fecha_inicio'] ?? null;
        unset($data['cargo'], $data['cargo_fecha_inicio']);

        if ($request->hasFile('imagen')) {
            if ($colaborador->imagen) {
                Storage::disk('public')->delete($colaborador->imagen);
            }

            $data['imagen'] = $request->file('imagen')->store('colaboradores', 'public');
        }

        $colaborador->update([
            ...$data,
            'is_active' => $request->boolean('is_active', true),
        ]);

        if ($cargo && $cargoFechaInicio && $cargo !== $colaborador->cargoActual?->cargo) {
            $cargoHistorial->asignar($colaborador, $cargo, $cargoFechaInicio);
        }

        if ($colaborador->user_id) {
            $usuario = User::find($colaborador->user_id);

            if ($usuario) {
                $this->sincronizarCorreoUsuario($usuario, $data['correo'] ?? null);
            }
        }

        $this->storeDocuments($request, $colaborador, ColaboradorDocumentoCampos::todas());

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador actualizado correctamente.');
    }

    public function destroy(Colaborador $colaborador): RedirectResponse
    {
        foreach ($this->documentPaths($colaborador) as $paths) {
            foreach ($paths as $path) {
                Storage::disk('public')->delete($path['path']);
            }
        }

        $colaborador->delete();

        return to_route('seguridad.colaboradores.index')->with('status', 'Colaborador eliminado correctamente.');
    }

    /**
     * @param  array<int, string>  $campos
     */
    private function storeDocuments(Request $request, Colaborador $colaborador, array $campos): void
    {
        foreach ($campos as $field) {
            $files = $request->file($field, []);
            $files = is_array($files) ? $files : [$files];

            foreach (array_filter($files) as $file) {
                $colaborador->documentos()->create([
                    'campo' => $field,
                    'path' => $file->store('colaboradores/documentos', 'public'),
                    'fecha_documento' => now()->toDateString(),
                ]);
            }
        }
    }

    /**
     * Al crear un colaborador se le provisiona automáticamente una cuenta
     * para el portal de autoservicio: usuario y contraseña son su cédula.
     * Si ya existe un usuario con esa cédula (p. ej. provisionado antes),
     * se reutiliza y solo se le asegura el rol Colaborador.
     */
    private function autoprovisionarUsuario(string $cedula, string $nombres, string $apellidos, ?string $correo = null): User
    {
        $usuario = User::where('identification_number', $cedula)->first();

        if (! $usuario) {
            $usuario = User::create([
                'first_name' => $nombres,
                'last_name' => $apellidos,
                'identification_number' => $cedula,
                'password' => $cedula,
                'is_active' => true,
            ]);
        }

        $this->sincronizarCorreoUsuario($usuario, $correo);

        if (! $usuario->hasRole(Role::Colaborador->value)) {
            $usuario->assignRole(Role::Colaborador->value);
        }

        return $usuario;
    }

    /**
     * Mantiene sincronizado el email de la cuenta con el "correo" del
     * formulario de colaborador (contacto), tanto al crear como al editar.
     * El correo del formulario no es único (es solo un dato de contacto),
     * así que solo se aplica si no choca con el email de otro usuario.
     */
    private function sincronizarCorreoUsuario(User $usuario, ?string $correo): void
    {
        if (! $correo || $correo === $usuario->email) {
            return;
        }

        $disponible = ! User::where('email', $correo)->whereKeyNot($usuario->id)->exists();

        if ($disponible) {
            $usuario->update(['email' => $correo]);
        }
    }

    private function usuariosVinculables(?Colaborador $colaborador = null): Collection
    {
        return User::role(Role::Colaborador->value)
            ->where(function ($query) use ($colaborador) {
                $query->whereDoesntHave('colaborador')
                    ->when($colaborador?->user_id, fn ($q) => $q->orWhere('id', $colaborador->user_id));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'identification_number']);
    }

    private function documentPaths(Colaborador $colaborador): array
    {
        $paths = [];

        foreach (ColaboradorDocumentoCampos::todas() as $field) {
            $paths[$field] = $colaborador->{$field}
                ? [['path' => $colaborador->{$field}, 'fecha' => null]]
                : [];
        }

        foreach ($colaborador->documentos as $documento) {
            $paths[$documento->campo][] = [
                'path' => $documento->path,
                'fecha' => $documento->fecha_documento?->format('Y-m-d'),
            ];
        }

        return $paths;
    }
}
