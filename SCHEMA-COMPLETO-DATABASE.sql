-- SCHEMA COMPLETO - SISTEMA DE GERENCIAMENTO DE ALMOXARIFADO
-- Este script cria todas as tabelas, índices, constraints e relacionamentos

-- ============================================================================
-- 1. CRIAÇÃO DE ENUMS
-- ============================================================================

-- Enum para roles de usuários
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');

-- Enum para tipos de movimentação
CREATE TYPE movement_type AS ENUM ('entry', 'exit');

-- Enum para origem de entradas
CREATE TYPE origin_type AS ENUM ('supplier', 'employee_return', 'third_party_return');

-- Enum para destino de saídas
CREATE TYPE destination_type AS ENUM ('employee', 'third_party');

-- ============================================================================
-- 2. TABELA DE USUÁRIOS
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name VARCHAR(200),
    role TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Índices para usuários
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_owner ON users("ownerId");
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 3. TABELA DE CATEGORIAS
-- ============================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Índices para categorias
CREATE INDEX idx_categories_owner ON categories(owner_id);
CREATE INDEX idx_categories_name ON categories(name);

-- ============================================================================
-- 4. TABELA DE FORNECEDORES
-- ============================================================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Índices para fornecedores
CREATE INDEX idx_suppliers_owner ON suppliers(owner_id);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- ============================================================================
-- 5. TABELA DE MATERIAIS
-- ============================================================================

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'unidade',
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    last_supplier_id INTEGER,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_materials_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_materials_supplier FOREIGN KEY (last_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Índices para materiais
CREATE INDEX idx_materials_owner ON materials(owner_id);
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_materials_supplier ON materials(last_supplier_id);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_stock ON materials(current_stock);

-- ============================================================================
-- 6. TABELA DE FUNCIONÁRIOS
-- ============================================================================

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Índices para funcionários
CREATE INDEX idx_employees_owner ON employees(owner_id);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_active ON employees("isActive");

-- ============================================================================
-- 7. TABELA DE TERCEIROS
-- ============================================================================

CREATE TABLE third_parties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    document VARCHAR(20),
    document_type VARCHAR(10) DEFAULT 'CPF',
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Índices para terceiros
CREATE INDEX idx_third_parties_owner ON third_parties(owner_id);
CREATE INDEX idx_third_parties_name ON third_parties(name);
CREATE INDEX idx_third_parties_document ON third_parties(document);
CREATE INDEX idx_third_parties_active ON third_parties(is_active);

-- ============================================================================
-- 8. TABELA DE MOVIMENTAÇÕES DE MATERIAIS
-- ============================================================================

CREATE TABLE material_movements (
    id SERIAL PRIMARY KEY,
    type movement_type NOT NULL,
    date TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Para entradas
    origin_type origin_type,
    supplier_id INTEGER,
    return_employee_id INTEGER,
    return_third_party_id INTEGER,
    
    -- Para saídas
    destination_type destination_type,
    employee_id INTEGER,
    third_party_id INTEGER,
    
    -- Itens da movimentação (array de JSON)
    items JSONB NOT NULL,
    
    -- Informações gerais
    description TEXT,
    total_value DECIMAL(12,2) DEFAULT 0.00,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_movements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_return_employee FOREIGN KEY (return_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_return_third_party FOREIGN KEY (return_third_party_id) REFERENCES third_parties(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_third_party FOREIGN KEY (third_party_id) REFERENCES third_parties(id) ON DELETE SET NULL
);

-- Índices para movimentações
CREATE INDEX idx_movements_owner ON material_movements(owner_id);
CREATE INDEX idx_movements_user ON material_movements(user_id);
CREATE INDEX idx_movements_type ON material_movements(type);
CREATE INDEX idx_movements_date ON material_movements(date);
CREATE INDEX idx_movements_supplier ON material_movements(supplier_id);
CREATE INDEX idx_movements_employee ON material_movements(employee_id);
CREATE INDEX idx_movements_third_party ON material_movements(third_party_id);

-- Índice GIN para busca nos itens JSON
CREATE INDEX idx_movements_items ON material_movements USING GIN (items);

-- ============================================================================
-- 9. TABELA DE LOGS DE AUDITORIA
-- ============================================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Índices para auditoria
CREATE INDEX idx_audit_owner ON audit_logs(owner_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Índices GIN para busca nos valores JSON
CREATE INDEX idx_audit_old_values ON audit_logs USING GIN (old_values);
CREATE INDEX idx_audit_new_values ON audit_logs USING GIN (new_values);

-- ============================================================================
-- 10. DADOS INICIAIS
-- ============================================================================

-- Inserir usuários padrão (senha: 1234 para ambos)
INSERT INTO users (username, email, password, name, role, "ownerId") VALUES
('cassio', 'cassio@example.com', '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8', 'Cassio Admin', 'super_admin', 1),
('empresa_teste', 'empresa@teste.com', '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8', 'Empresa Teste', 'admin', 1);

-- Inserir categorias iniciais
INSERT INTO categories (name, description, owner_id) VALUES
('Materiais de Escritório', 'Papelaria e suprimentos de escritório', 1),
('Equipamentos', 'Equipamentos e ferramentas', 1),
('Materiais de Limpeza', 'Produtos de limpeza e higiene', 1),
('Materiais Elétricos', 'Componentes e materiais elétricos', 1);

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE users IS 'Usuários do sistema com controle de roles e multi-tenancy';
COMMENT ON TABLE categories IS 'Categorias para organização dos materiais';
COMMENT ON TABLE materials IS 'Inventário de materiais com controle de estoque';
COMMENT ON TABLE employees IS 'Funcionários da empresa';
COMMENT ON TABLE suppliers IS 'Fornecedores de materiais';
COMMENT ON TABLE third_parties IS 'Terceiros (empresas externas, prestadores)';
COMMENT ON TABLE material_movements IS 'Movimentações de entrada e saída de materiais';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de mudanças';

COMMENT ON COLUMN materials.current_stock IS 'Estoque atual do material';
COMMENT ON COLUMN materials.minimum_stock IS 'Estoque mínimo para alerta';
COMMENT ON COLUMN materials.unit_price IS 'Preço unitário do material';
COMMENT ON COLUMN material_movements.items IS 'Array JSON com detalhes dos itens movimentados';
COMMENT ON COLUMN material_movements.total_value IS 'Valor total da movimentação';