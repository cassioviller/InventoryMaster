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
import { authenticatedRequest } from '@/lib/auth-request';
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
    { id: 'materials', label: 'Materiais' },
    { id: 'categories', label: 'Categorias' },
    { id: 'employees', label: 'Funcionários' },
    { id: 'suppliers', label: 'Fornecedores' },
    { id: 'third-parties', label: 'Terceiros' },
  ];
  
  if (canCreateUsers) {
    baseItems.push({ id: 'users', label: 'Usuários' });
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

  // Query data for each tab
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/materials', searchQuery, selectedCategory],
    queryFn: async () => {
      try {
        let url = '/api/materials';
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory) params.append('category', selectedCategory);
        if (params.toString()) url += '?' + params.toString();
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
    },
    enabled: activeTab === 'materials' && !!localStorage.getItem('token'),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories', searchQuery],
    queryFn: async () => {
      try {
        let url = '/api/categories';
        if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    enabled: activeTab === 'categories' && !!localStorage.getItem('token'),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees', searchQuery],
    queryFn: async () => {
      try {
        let url = '/api/employees';
        if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    },
    enabled: activeTab === 'employees' && !!localStorage.getItem('token'),
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/suppliers', searchQuery],
    queryFn: async () => {
      try {
        let url = '/api/suppliers';
        if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
    },
    enabled: activeTab === 'suppliers' && !!localStorage.getItem('token'),
  });

  const { data: thirdPartiesData, isLoading: thirdPartiesLoading } = useQuery({
    queryKey: ['/api/third-parties', searchQuery],
    queryFn: async () => {
      try {
        let url = '/api/third-parties';
        if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching third-parties:', error);
        return [];
      }
    },
    enabled: activeTab === 'third-parties' && !!localStorage.getItem('token'),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users', searchQuery],
    queryFn: async () => {
      try {
        let url = '/api/users';
        if (searchQuery) url += '?search=' + encodeURIComponent(searchQuery);
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: activeTab === 'users' && canCreateUsers && !!localStorage.getItem('token'),
  });

  const materials = materialsData || [];
  const categories = categoriesData || [];
  const employees = employeesData || [];
  const suppliers = suppliersData || [];
  const thirdParties = thirdPartiesData || [];
  const users = usersData || [];

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
    try {
      const endpoint = type === 'third-party' ? 'third-parties' : `${type}s`;
      await apiRequest(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Sucesso',
        description: `${type === 'material' ? 'Material' : 
                      type === 'category' ? 'Categoria' : 
                      type === 'employee' ? 'Funcionário' : 
                      type === 'supplier' ? 'Fornecedor' : 
                      type === 'third-party' ? 'Terceiro' : 
                      'Usuário'} excluído com sucesso.`,
      });

      // Invalidate cache for the specific entity type
      if (type === 'third-party') {
        queryClient.invalidateQueries({ queryKey: ['/api/third-parties'] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir item. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'materials':
        if (materialsLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : materials?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum material encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(materials) && materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.category?.name || '-'}</TableCell>
                        <TableCell>{material.currentStock}</TableCell>
                        <TableCell>{material.minimumStock}</TableCell>
                        <TableCell>
                          {getStatusBadge(material.currentStock, material.minimumStock)}
                        </TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'categories':
        if (categoriesLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : categories?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhuma categoria encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(categories) && categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(category.id, 'category')}
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

      case 'employees':
        if (employeesLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : employees?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum funcionário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(employees) && employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.email || '-'}</TableCell>
                        <TableCell>{employee.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={employee.isActive ? "default" : "secondary"}>
                            {employee.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'suppliers':
        if (suppliersLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : suppliers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(suppliers) && suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.cnpj || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.isActive ? "default" : "secondary"}>
                            {supplier.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'third-parties':
        if (thirdPartiesLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thirdPartiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : thirdParties?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum terceiro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(thirdParties) && thirdParties.map((thirdParty) => (
                      <TableRow key={thirdParty.id}>
                        <TableCell className="font-medium">{thirdParty.name}</TableCell>
                        <TableCell>{thirdParty.document || '-'}</TableCell>
                        <TableCell>{thirdParty.email || '-'}</TableCell>
                        <TableCell>{thirdParty.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={thirdParty.isActive ? "default" : "secondary"}>
                            {thirdParty.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'users':
        if (usersLoading) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome de Usuário</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(users) && users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'super_admin' ? 'destructive' :
                            user.role === 'admin' ? 'default' : 'secondary'
                          }>
                            {user.role === 'super_admin' ? 'Super Admin' :
                             user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
          <p className="text-muted-foreground">
            Gerencie materiais, categorias, funcionários, fornecedores e terceiros
          </p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            {tabItems.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className="px-4 py-2"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {activeTab === 'materials' && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {Array.isArray(categoriesData) && categoriesData.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo{' '}
              {activeTab === 'materials' ? 'Material' :
               activeTab === 'categories' ? 'Categoria' :
               activeTab === 'employees' ? 'Funcionário' :
               activeTab === 'suppliers' ? 'Fornecedor' :
               activeTab === 'third-parties' ? 'Terceiro' :
               'Usuário'}
            </Button>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </CardContent>
      </Card>

      {/* Modals */}
      <MaterialModal
        isOpen={materialModalOpen}
        onClose={handleModalClose}
        material={editingItem}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={handleModalClose}
        category={editingItem}
      />

      <EmployeeModal
        isOpen={employeeModalOpen}
        onClose={handleModalClose}
        employee={editingItem}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={handleModalClose}
        supplier={editingItem}
      />

      <ThirdPartyModal
        isOpen={thirdPartyModalOpen}
        onClose={handleModalClose}
        thirdParty={editingItem}
      />

      <UserModal
        isOpen={userModalOpen}
        onClose={handleModalClose}
        user={editingItem}
      />
    </div>
  );
}