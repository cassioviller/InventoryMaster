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

  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/materials', searchQuery, selectedCategory],
    queryFn: async () => {
      try {
        let url = '/api/materials';
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory);
        if (params.toString()) url += '?' + params.toString();
        
        const res = await authenticatedRequest(url);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const res = await authenticatedRequest('/api/categories');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      try {
        const res = await authenticatedRequest('/api/employees');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      try {
        const res = await authenticatedRequest('/api/suppliers');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: thirdPartiesData, isLoading: thirdPartiesLoading } = useQuery({
    queryKey: ['/api/third-parties'],
    queryFn: async () => {
      try {
        const res = await authenticatedRequest('/api/third-parties');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching third parties:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token'),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const res = await authenticatedRequest('/api/users');
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token') && canCreateUsers,
  });

  const materials = materialsData || [];
  const categories = categoriesData || [];
  const employees = employeesData || [];
  const suppliers = suppliersData || [];
  const thirdParties = thirdPartiesData || [];
  const users = usersData || [];

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
      let endpoint = '';
      let queryKey = '';
      
      switch (activeTab) {
        case 'materials':
          endpoint = `/api/materials/${id}`;
          queryKey = '/api/materials';
          break;
        case 'categories':
          endpoint = `/api/categories/${id}`;
          queryKey = '/api/categories';
          break;
        case 'employees':
          endpoint = `/api/employees/${id}`;
          queryKey = '/api/employees';
          break;
        case 'suppliers':
          endpoint = `/api/suppliers/${id}`;
          queryKey = '/api/suppliers';
          break;
        case 'third-parties':
          endpoint = `/api/third-parties/${id}`;
          queryKey = '/api/third-parties';
          break;
        case 'users':
          endpoint = `/api/users/${id}`;
          queryKey = '/api/users';
          break;
      }

      await apiRequest(endpoint, 'DELETE');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      
      toast({
        title: "Sucesso",
        description: `${type} excluído com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro",
        description: `Falha ao excluir ${type}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'materials':
        return materials;
      case 'categories':
        return categories;
      case 'employees':
        return employees;
      case 'suppliers':
        return suppliers;
      case 'third-parties':
        return thirdParties;
      case 'users':
        return users;
      default:
        return [];
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case 'materials':
        return materialsLoading;
      case 'employees':
        return employeesLoading;
      case 'suppliers':
        return suppliersLoading;
      case 'third-parties':
        return thirdPartiesLoading;
      case 'users':
        return usersLoading;
      default:
        return false;
    }
  };

  const renderTable = () => {
    const data = getCurrentData();
    const loading = isLoading();

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhum registro encontrado
        </div>
      );
    }

    switch (activeTab) {
      case 'materials':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((material: Material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>
                    {categories.find((c) => c.id === material.categoryId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={material.currentStock <= material.minimumStock ? "destructive" : "secondary"}>
                      {material.currentStock}
                    </Badge>
                  </TableCell>
                  <TableCell>R$ {material.unitPrice}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(material.id, 'material')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'categories':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(category.id, 'categoria')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'employees':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((employee: Employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                      {employee.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(employee.id, 'funcionário')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'suppliers':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((supplier: Supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.cnpj}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(supplier.id, 'fornecedor')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'third-parties':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((thirdParty: ThirdParty) => (
                <TableRow key={thirdParty.id}>
                  <TableCell>{thirdParty.name}</TableCell>
                  <TableCell>{thirdParty.document}</TableCell>
                  <TableCell>{thirdParty.email}</TableCell>
                  <TableCell>
                    <Badge variant={thirdParty.isActive ? "default" : "secondary"}>
                      {thirdParty.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(thirdParty)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(thirdParty.id, 'terceiro')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'users':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome de Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge>
                      {user.role === 'super_admin' ? 'Super Admin' : 
                       user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.role !== 'super_admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id, 'usuário')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Cadastros</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={cn(
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Header with search and actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
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
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo {tabItems.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              {renderTable()}
            </div>
          </div>
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