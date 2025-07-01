-- Migration script for production environment
-- Execute this SQL directly on the production PostgreSQL database

-- Create cost_centers table if it doesn't exist
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    responsible TEXT NOT NULL,
    monthly_budget DECIMAL(10,2),
    annual_budget DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    owner_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add cost_center_id column to material_movements if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'material_movements' 
        AND column_name = 'cost_center_id'
    ) THEN
        ALTER TABLE material_movements ADD COLUMN cost_center_id INTEGER REFERENCES cost_centers(id);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'material_movements_cost_center_id_fkey'
    ) THEN
        ALTER TABLE material_movements 
        ADD CONSTRAINT material_movements_cost_center_id_fkey 
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);
    END IF;
END $$;

-- Insert sample cost centers if table is empty
INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id)
SELECT 'ADM001', 'Administração Geral', 'Centro de custo para atividades administrativas', 'Administração', 'Gerente Administrativo', 8000.00, 96000.00, true, 1
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'ADM001');

INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id)
SELECT 'MANUT001', 'Manutenção Predial', 'Centro de custo para manutenção de equipamentos e instalações', 'Manutenção', 'Supervisor de Manutenção', 5000.00, 60000.00, true, 1
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'MANUT001');

INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id)
SELECT 'PROD001', 'Produção Linha A', 'Centro de custo para linha de produção principal', 'Produção', 'Gerente de Produção', 15000.00, 180000.00, true, 1
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'PROD001');

INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id)
SELECT 'TEST001', 'Centro de Teste', 'Centro de custo criado para testes do sistema', 'Teste', 'Teste', 3000.00, 36000.00, true, 1
WHERE NOT EXISTS (SELECT 1 FROM cost_centers WHERE code = 'TEST001');

-- Verify tables exist
SELECT 'cost_centers table exists' as status, count(*) as records FROM cost_centers;
SELECT 'material_movements cost_center_id column exists' as status FROM information_schema.columns WHERE table_name = 'material_movements' AND column_name = 'cost_center_id';

-- Show current schema for verification
\d cost_centers
\d material_movements