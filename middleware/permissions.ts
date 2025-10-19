export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissions()

  // Verificar se o usuário está autenticado
  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }

  // Definir permissões necessárias para cada rota
  const routePermissions: Record<string, string[]> = {
    '/': [], // Dashboard não precisa de permissão específica
    '/dashboard': [], // Dashboard não precisa de permissão específica
    '/global-dashboard': ['report-read'],
    '/users': ['user-read'],
    '/users/create': ['user-create'],
    '/users/edit': ['user-update'],
    '/users/delete': ['user-delete'],
    '/admins': ['admin-read'],
    '/admins/create': ['admin-create'],
    '/admins/edit': ['admin-update'],
    '/admins/delete': ['admin-delete'],
    '/roles': ['role-assign'],
    '/roles/create': ['role-create'],
    '/roles/edit': ['role-update'],
    '/roles/delete': ['role-delete'],
    '/domains': ['domain-read'],
    '/domains/create': ['domain-create'],
    '/domains/edit': ['domain-update'],
    '/domains/delete': ['domain-delete'],
    '/reports': ['report-read'],
    '/reports/view': ['report-read'],
    '/chat': ['chat-read'],
    '/chat/manage': ['chat-manage'],
    '/roles/assign': ['role-assign'],
  }

  // Verificar rotas dinâmicas (com parâmetros)
  let requiredPermissions = routePermissions[to.path]

  // Se não encontrou permissões exatas, verificar padrões de rota
  if (!requiredPermissions) {
    // Domain dashboard route: /domains/:id/dashboard
    if (to.path.match(/^\/domains\/\d+\/dashboard$/)) {
      requiredPermissions = ['domain-read', 'report-read']
    }
    // Domain reports route: /domains/:id/reports
    if (to.path.match(/^\/domains\/\d+\/reports$/)) {
      requiredPermissions = ['domain-read', 'report-read']
    }
    // Report dashboard route: /reports/:id/dashboard
    if (to.path.match(/^\/reports\/\d+\/dashboard$/)) {
      requiredPermissions = ['report-read']
    }
  }

  // Se a rota não tem permissões definidas, permitir acesso
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return
  }

  // Super admin tem acesso a tudo
  if (isSuperAdmin.value) {
    return
  }

  // Verificar se o usuário tem pelo menos uma das permissões necessárias
  const hasRequiredPermission = requiredPermissions.some(permission => 
    hasPermission(permission)
  )

  if (!hasRequiredPermission) {
    // Redirecionar para página de acesso negado ou dashboard
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Você não tem permissão para acessar esta página.'
    })
  }
})
