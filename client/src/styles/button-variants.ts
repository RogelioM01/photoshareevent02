// BUTTON STYLE GUIDE - Rocky Events Project
// 
// Este archivo define los estilos consistentes para botones en toda la aplicación
// Nombre del estilo: "Rocky Button System" - usa este nombre para referencias futuras

export const rockyButtonStyles = {
  // PRIMARIO: Botones de acción principal (guardar, enviar, confirmar)
  primary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0",
  
  // SECUNDARIO: Botones de apoyo (cancelar, volver, opcional)
  secondary: "bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0",
  
  // ÉXITO: Botones de confirmación positiva (completado, éxito)
  success: "bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0",
  
  // PELIGRO: Botones destructivos (eliminar, cancelar definitivo)
  danger: "bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0",
  
  // OUTLINE: Botones con borde (navegación, acciones opcionales)
  outline: "bg-transparent hover:bg-blue-50 text-blue-600 font-medium px-4 py-2 border-2 border-blue-600 hover:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  
  // GHOST: Botones minimalistas (enlaces, navegación sutil)
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium px-4 py-2 shadow-none hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0"
};

// COMPONENTES DE LOADING: Para usar con iconos de carga
export const rockyLoadingStyles = {
  spinner: "h-4 w-4 mr-2 animate-spin text-white",
  text: "text-white font-medium"
};

// EJEMPLOS DE USO:
//
// <Button className={rockyButtonStyles.primary}>
//   Guardar Cambios
// </Button>
//
// <Button className={rockyButtonStyles.outline}>
//   Cancelar
// </Button>
//
// <Button className={rockyButtonStyles.primary} disabled={isLoading}>
//   {isLoading ? (
//     <>
//       <Loader2 className={rockyLoadingStyles.spinner} />
//       <span className={rockyLoadingStyles.text}>Cargando...</span>
//     </>
//   ) : (
//     <span className="text-white">Enviar</span>
//   )}
// </Button>