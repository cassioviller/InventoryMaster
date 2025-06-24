import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authenticatedRequest } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MaterialModal } from '@/components/modals/material-modal';
import { CategoryModal } from '@/components/modals/category-modal';
import { EmployeeModal } from '@/components/modals/employee-modal';
import { SupplierModal } from '@/components/modals/supplier-modal';
import { ThirdPartyModal } from '@/components/modals/third-party-modal';
import { UserModal } from '@/components/modals/user-modal';
import { useAuth } from '@/hooks/use-auth';
import type { Material, Category, Employee, Supplier, ThirdParty, User } from '@shared/schema';

type ActiveTab = 'materials' | 'categories' | 'employees' | 'suppliers' | 'third-parties' | 'users';

const getTabItems = (canCreateUsers: boolean) => {
  const baseItems = [
    { id: 'materials' as const, label: 'Materiais' },
    { id: 'categories' as const, label: 'Categorias' },
    { id: 'employees' as const, label: 'Funcionários' },
    { id: 'suppliers' as const, label: 'Fornecedores' },
    { id: 'third-parties' as const, label: 'Terceiros' },
  ];
  
  if (canCreateUsers) {
    baseItems.push({ id: 'users' as const, label: 'Usuários' });
  }
  
  return baseItems;
};

export default function Management() {
  const { canCreateUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [thirdPartyModalOpen, setThirdPartyModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { toast } = useToast();
  const tabItems = getTabItems(canCreateUsers);

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/materials', searchQuery, selectedCategory],
    queryFn: async () => {
      let url = '/api/materials';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (params.toString()) url += '?' + params.toString();
      
      const res = await authenticatedRequest(url);
      return res.json() as Promise<(Material & { category: Category })[]>;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/categories');
      return res.json() as Promise<Category[]>;
    },
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees', searchQuery],
    queryFn: async () => {
      let url = '/api/employees';
      if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
      
      const res = await authenticatedRequest(url);
      return res.json() as Promise<Employee[]>;
    },
    enabled: activeTab === 'employees',
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/suppliers', searchQuery],
    queryFn: async () => {
      let url = '/api/suppliers';
      if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
      
      const res = await authenticatedRequest(url);
      return res.json() as Promise<Supplier[]>;
    },
    enabled: activeTab === 'suppliers',
  });

  const { data: thirdParties, isLoading: thirdPartiesLoading } = useQuery({
    queryKey: ['/api/third-parties', searchQuery],
    queryFn: async () => {
      let url = '/api/third-parties';
      if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
      
      const res = await authenticatedRequest(url);
      return res.json() as Promise<ThirdParty[]>;
    },
    enabled: activeTab === 'third-parties',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await authenticatedRequest('/api/users');
      return res.json() as Promise<User[]>;
    },
    enabled: activeTab === 'users' && canCreateUsers,
  });

  const getStatusBadge = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) {
      return <Badge variant="destructive">Crítico</Badge>;
    } else if (currentStock <= minimumStock) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Baixo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Normal</Badge>;
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    switch (activeTab) {
      case 'materials':
        setMaterialModalOpen(true);
        break;
      case 'categories':
        setCategoryModalOpen(true);
        break;
      case 'employees':
        setEmployeeModalOpen(true);
        break;
      case 'suppliers':
        setSupplierModalOpen(true);
        break;
      case 'third-parties':
        setThirdPartyModalOpen(true);
        break;
      case 'users':
        setUserModalOpen(true);
        break;
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    switch (activeTab) {
      case 'materials':
        setMaterialModalOpen(true);
        break;
      case 'categories':
        setCategoryModalOpen(true);
        break;
      case 'employees':
        setEmployeeModalOpen(true);
        break;
      case 'suppliers':
        setSupplierModalOpen(true);
        break;
      case 'third-parties':
        setThirdPartyModalOpen(true);
        break;
      case 'users':
        setUserModalOpen(true);
        break;
    }
  };

  const handleModalClose = () => {
    setEditingItem(null);
    setMaterialModalOpen(false);
    setCategoryModalOpen(false);
    setEmployeeModalOpen(false);
    setSupplierModalOpen(false);
    setThirdPartyModalOpen(false);
    setUserModalOpen(false);
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`Tem certeza que deseja excluir este ${type}?`)) return;
    
    try {
      const endpoint = type === 'third-party' ? 'third-parties' : 
                      type === 'category' ? 'categories' :
                      type === 'material' ? 'materials' :
                      type === 'user' ? 'users' : `${type}s`;
      
      await apiRequest(`/api/${endpoint}/${id}`, 'DELETE');
      
      // Invalidate relevant queries to refresh data
      if (type === 'employee') {
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      } else if (type === 'supplier') {
        queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      } else if (type === 'third-party') {
        queryClient.invalidateQueries({ queryKey: ['/api/third-parties'] });
      } else if (type === 'category') {
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      } else if (type === 'material') {
        queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      } else if (type === 'user') {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      }
      
      toast({
        title: "Sucesso",
        description: `${type} excluído com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao excluir ${type}`,
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'materials':
        if (materialsLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar materiais..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {Array.isArray(categories) && categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(materials) && materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category.name}</TableCell>
                      <TableCell>{material.currentStock}</TableCell>
                      <TableCell>{material.minimumStock}</TableCell>
                      <TableCell>
                        {getStatusBadge(material.currentStock, material.minimumStock)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id, 'material')}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((category) => (
              <Card key={category.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {materials?.filter(m => m.categoryId === category.id).length || 0} materiais
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id, 'category')}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'employees':
        if (employeesLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar funcionários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(employees) && employees.length > 0 ? employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id, 'employee')}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum funcionário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'suppliers':
        if (suppliersLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(suppliers) && suppliers.length > 0 ? suppliers.map((supplier) => (
                    <TableRow 
                      key={supplier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEdit(supplier)}
                    >
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.cnpj}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier.id, 'supplier')}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'third-parties':
        if (thirdPartiesLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar terceiros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(thirdParties) && thirdParties.length > 0 ? thirdParties.map((thirdParty) => (
                    <TableRow key={thirdParty.id}>
                      <TableCell className="font-medium">{thirdParty.name}</TableCell>
                      <TableCell>{thirdParty.document}</TableCell>
                      <TableCell>{thirdParty.documentType}</TableCell>
                      <TableCell>{thirdParty.email}</TableCell>
                      <TableCell>{thirdParty.phone}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(thirdParty)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(thirdParty.id, 'third-party')}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum terceiro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'users':
        if (!canCreateUsers) return null;
        
        return (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome de Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(users) && users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id, 'user')}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestão de Cadastros</h2>
                <p className="text-sm text-gray-600">Gerencie materiais, categorias, funcionários e fornecedores</p>
              </div>
            </div>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo {tabItems.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </Button>
          </div>
          
          {/* Sub Navigation */}
          <div className="px-6">
            <nav className="flex space-x-8">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {tabItems.find(t => t.id === activeTab)?.label}
              </h3>
            </div>
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <MaterialModal
        open={materialModalOpen}
        onOpenChange={setMaterialModalOpen}
        material={editingItem}
        onClose={handleModalClose}
      />
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        category={editingItem}
        onClose={handleModalClose}
      />
      <EmployeeModal
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
        employee={editingItem}
        onClose={handleModalClose}
      />
      <SupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        supplier={editingItem}
        onClose={handleModalClose}
      />
      <ThirdPartyModal
        open={thirdPartyModalOpen}
        onOpenChange={setThirdPartyModalOpen}
        thirdParty={editingItem}
        onClose={handleModalClose}
      />
      {canCreateUsers && (
        <UserModal
          open={userModalOpen}
          onOpenChange={setUserModalOpen}
          editingUser={editingItem}
        />
      )}
    </div>
  );
}
