-- Insert demo users (Note: In production, use Supabase Auth to create users with proper authentication)
-- These are placeholder users for development
INSERT INTO public.users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@taller.com', 'Administrador', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'cliente@ejemplo.com', 'Juan Pérez', 'client'),
  ('00000000-0000-0000-0000-000000000003', 'tecnico@taller.com', 'Carlos Mecánico', 'technician')
ON CONFLICT (id) DO NOTHING;

-- Insert demo vehicles
INSERT INTO public.vehicles (id, client_id, brand, model, year, license_plate, vin, color) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Toyota', 'Corolla', 2020, 'ABC123', '1HGBH41JXMN109186', 'Plata'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Honda', 'Civic', 2019, 'XYZ789', '2HGFC2F59KH542891', 'Negro')
ON CONFLICT (id) DO NOTHING;

-- Insert demo service orders
INSERT INTO public.service_orders (
  id, 
  vehicle_id, 
  client_id, 
  technician_id, 
  state, 
  description, 
  services,
  diagnosis,
  estimated_cost,
  intake_photos,
  service_photos
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'in-progress',
    'Mantenimiento general y cambio de aceite',
    '[
      {"id": "s1", "description": "Cambio de aceite", "completed": true, "completedAt": "2024-01-15T10:00:00Z", "completedBy": "00000000-0000-0000-0000-000000000003"},
      {"id": "s2", "description": "Revisión de frenos", "completed": false}
    ]'::jsonb,
    'El vehículo requiere cambio de aceite y revisión general. Los frenos están en buen estado.',
    250000.00,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'pending',
    'Revisión de motor',
    '[
      {"id": "s1", "description": "Diagnóstico de motor", "completed": false}
    ]'::jsonb,
    NULL,
    NULL,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  )
ON CONFLICT (id) DO NOTHING;

-- Insert demo expenses
INSERT INTO public.expenses (id, description, amount, category, date, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Compra de aceite motor', 150000.00, 'Suministros', CURRENT_DATE - INTERVAL '5 days', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Herramientas de diagnóstico', 450000.00, 'Equipamiento', CURRENT_DATE - INTERVAL '10 days', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', 'Filtros varios', 85000.00, 'Suministros', CURRENT_DATE - INTERVAL '3 days', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert state history for the service orders
INSERT INTO public.state_history (service_order_id, previous_state, new_state, changed_by, notes) VALUES
  ('20000000-0000-0000-0000-000000000001', 'pending', 'in-diagnosis', '00000000-0000-0000-0000-000000000003', 'Iniciando diagnóstico del vehículo'),
  ('20000000-0000-0000-0000-000000000001', 'in-diagnosis', 'in-progress', '00000000-0000-0000-0000-000000000003', 'Cliente aprobó el presupuesto, iniciando reparaciones')
ON CONFLICT DO NOTHING;
