export function getIndustryTerms(industry?: string) {
  const isAutomotive = industry === "Automotriz";
  const isPersonal = industry === "Particular / Uso Personal";
  
  return {
    branch: isAutomotive ? "Taller / Sucursal" : isPersonal ? "Mi Garaje / Ubicación" : "Hacienda / Base",
    asset: (isAutomotive || isPersonal) ? "Vehículo" : "Activo / Máquina",
    assets: (isAutomotive || isPersonal) ? "Vehículos" : "Activos / Máquinas",
    operator: isAutomotive ? "Mecánico / Técnico" : isPersonal ? "Propietario" : "Operador",
    checklists: isAutomotive ? "Inspecciones" : isPersonal ? "Mis Revisiones" : "Checklists Diarios",
    serviceOptions: (isAutomotive || isPersonal)
      ? [
          "Cambio de aceite y filtros",
          "Mecánica general",
          "Frenos",
          "Alineación y balanceo",
          "Electricidad",
          "Lavado",
          "Revisión de rutina",
          "Otro"
        ]
      : [
          "Checklist Diario",
          "Limpieza de pico",
          "Mantenimiento preventivo",
          "Revisión general",
          "Otro"
        ],
    hasLicensePlate: isAutomotive || isPersonal,
    hasCustomer: isAutomotive, // El particular no necesita campo "Cliente" porque él es el dueño
  };
}
