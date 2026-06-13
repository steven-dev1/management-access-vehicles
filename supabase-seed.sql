-- =============================================
-- SEED DATA - VEHICLE ACCESS MANAGEMENT
-- =============================================

-- Clear existing data
TRUNCATE TABLE vehicles;

-- =============================================
-- Sample vehicles across multiple towers
-- =============================================

-- Tower 1
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('ABC-1234', 'car', 1, 1, 1, '101', 'João Silva'),
  ('DEF-5678', 'motorcycle', 1, 1, 2, '102', 'Maria Santos'),
  ('GHI-9012', 'car', 1, 2, 1, '201', 'Pedro Oliveira'),
  ('JKL-3456', 'car', 1, 3, 3, '303', 'Ana Costa'),
  ('MNO-7890', 'motorcycle', 1, 4, 1, '401', 'Carlos Souza'),
  ('PQR-1111', 'car', 1, 5, 2, '502', 'Lucia Ferreira');

-- Tower 2
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('STU-2222', 'car', 2, 1, 1, '101', 'Roberto Lima'),
  ('VWX-3333', 'motorcycle', 2, 1, 3, '103', 'Fernanda Alves'),
  ('YZA-4444', 'car', 2, 2, 2, '202', 'Marcos Pereira'),
  ('BCD-5555', 'motorcycle', 2, 3, 1, '301', 'Juliana Ribeiro'),
  ('EFG-6666', 'car', 2, 4, 4, '404', 'Ricardo Martins'),
  ('HIJ-7777', 'car', 2, 5, 3, '503', 'Patricia Gomes');

-- Tower 3
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('KLM-8888', 'car', 3, 1, 2, '102', 'Antonio Barros'),
  ('NOP-9999', 'motorcycle', 3, 2, 1, '201', 'Sandra Araujo'),
  ('QRS-1010', 'car', 3, 3, 2, '302', 'Eduardo Campos'),
  ('TUV-2020', 'motorcycle', 3, 4, 3, '403', 'Vanessa Dias'),
  ('WXY-3030', 'car', 3, 5, 1, '501', 'Felipe Rocha');

-- Tower 4
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('ZAB-4040', 'car', 4, 1, 1, '101', 'Thiago Mendes'),
  ('CDE-5050', 'motorcycle', 4, 2, 3, '203', 'Camila Lopes'),
  ('FGH-6060', 'car', 4, 3, 4, '304', 'Bruno Carvalho'),
  ('IJK-7070', 'car', 4, 4, 2, '402', 'Priscila Teixeira'),
  ('LMN-8080', 'motorcycle', 4, 5, 4, '504', 'Gustavo Nunes');

-- Tower 5
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('OPQ-9090', 'car', 5, 1, 3, '103', 'Renata Barbosa'),
  ('RST-1212', 'motorcycle', 5, 2, 2, '202', 'Leonardo Azevedo'),
  ('UVW-3434', 'car', 5, 3, 1, '301', 'Isabela Cardoso'),
  ('XYZ-5656', 'car', 5, 4, 4, '404', 'Diego Ramos'),
  ('ABC-7878', 'motorcycle', 5, 5, 2, '502', 'Amanda Vieira');

-- Tower 6 - Add some apartment violations (2 cars in same apartment)
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('DEF-9090', 'car', 6, 1, 1, '101', 'Rodrigo Cunha'),
  ('GHI-1111', 'car', 6, 1, 1, '101', 'Helena Moreira'),
  ('JKL-2222', 'motorcycle', 6, 2, 2, '202', 'Lucas Reis'),
  ('MNO-3333', 'car', 6, 3, 3, '303', 'Tatiana Pinto'),
  ('PQR-4444', 'motorcycle', 6, 4, 1, '401', 'Marcio Teles'),
  ('STU-5555', 'car', 6, 5, 2, '502', 'Bianca Monteiro');

-- Tower 7
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('VWX-6666', 'car', 7, 1, 2, '102', 'Andre Duarte'),
  ('YZA-7777', 'motorcycle', 7, 2, 4, '204', 'Julia Fernandes'),
  ('BCD-8888', 'car', 7, 3, 1, '301', 'Paulo Rangel'),
  ('EFG-9999', 'car', 7, 4, 3, '403', 'Mariana Tavares'),
  ('HIJ-0000', 'motorcycle', 7, 5, 1, '501', 'Sergio Pires');

-- Tower 8
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('KLM-1313', 'car', 8, 1, 3, '103', 'Adriana Correia'),
  ('NOP-2424', 'motorcycle', 8, 2, 1, '201', 'Robson Machado'),
  ('QRS-3535', 'car', 8, 3, 2, '302', 'Vanessa Lima'),
  ('TUV-4646', 'car', 8, 4, 4, '404', 'Rafael Esteves'),
  ('WXY-5757', 'motorcycle', 8, 5, 3, '503', 'Natalia Castro');

-- Tower 9
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('ZAB-6868', 'car', 9, 1, 1, '101', 'Elias Freitas'),
  ('CDE-7979', 'motorcycle', 9, 2, 2, '202', 'Valeria Dias'),
  ('FGH-8080', 'car', 9, 3, 4, '304', 'Claudio Miranda'),
  ('IJK-9191', 'motorcycle', 9, 4, 1, '401', 'Daniela Barros'),
  ('LMN-0202', 'car', 9, 5, 2, '502', 'Fabio Sales');

-- Tower 10
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('OPQ-1313', 'car', 10, 1, 2, '102', 'Cristina Medeiros'),
  ('RST-2424', 'motorcycle', 10, 2, 3, '203', 'Henrique Gomes'),
  ('UVW-3535', 'car', 10, 3, 1, '301', 'Letícia Rezende'),
  ('XYZ-4646', 'car', 10, 4, 4, '404', 'Mateus Braga'),
  ('ABC-5757', 'motorcycle', 10, 5, 1, '501', 'Priscila Nascimento');

-- Tower 11 - Another violation (2 motorcycles in same apartment)
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('DEF-6868', 'car', 11, 1, 1, '101', 'Alexandre Viana'),
  ('GHI-7979', 'motorcycle', 11, 2, 2, '202', 'Sonia Almeida'),
  ('HIJ-8080', 'motorcycle', 11, 2, 2, '202', 'Caio Figueired'),
  ('JKL-9191', 'car', 11, 3, 3, '303', 'Teresa Caldeira'),
  ('MNO-0202', 'motorcycle', 11, 4, 4, '404', 'Gabriel Trindade');

-- Tower 12
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('PQR-1313', 'car', 12, 1, 3, '103', 'Raquel Seabra'),
  ('STU-2424', 'motorcycle', 12, 2, 1, '201', 'Victor Hugo'),
  ('VWX-3535', 'car', 12, 3, 2, '302', 'Cecilia Amaral'),
  ('YZA-4646', 'car', 12, 4, 4, '404', 'Murilo Prado'),
  ('BCD-5757', 'motorcycle', 12, 5, 3, '503', 'Larissa Queiroz');

-- Tower 13
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('CDE-6868', 'car', 13, 1, 2, '102', 'Otavio Rosa'),
  ('FGH-7979', 'motorcycle', 13, 2, 4, '204', 'Aline Brilhante'),
  ('IJK-8080', 'car', 13, 3, 1, '301', 'Sergio Cavalcanti'),
  ('LMN-9191', 'car', 13, 4, 3, '403', 'Fernanda Macedo'),
  ('OPQ-0202', 'motorcycle', 13, 5, 2, '502', 'Igor Teixeira');

-- Tower 14
INSERT INTO vehicles (license_plate, vehicle_type, tower, floor, apartment, apartment_code, owner_name) VALUES
  ('RST-1313', 'car', 14, 1, 1, '101', 'Breno Lins'),
  ('TUV-2424', 'motorcycle', 14, 2, 3, '203', 'Patricia Belo'),
  ('WXY-3535', 'car', 14, 3, 2, '302', 'Marcelo Tavares'),
  ('ZAB-4646', 'car', 14, 4, 1, '401', 'Juliana Mota'),
  ('CDE-5757', 'motorcycle', 14, 5, 4, '504', 'Ricardo Neves');

-- =============================================
-- Verify seed data
-- =============================================
SELECT
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE vehicle_type = 'car') as total_cars,
  COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') as total_motorcycles
FROM vehicles;

-- Check apartment violations
SELECT
  apartment_code,
  tower,
  COUNT(*) as vehicle_count,
  COUNT(*) FILTER (WHERE vehicle_type = 'car') as car_count,
  COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') as motorcycle_count
FROM vehicles
GROUP BY apartment_code, tower
HAVING COUNT(*) > 2
   OR COUNT(*) FILTER (WHERE vehicle_type = 'car') > 1
   OR COUNT(*) FILTER (WHERE vehicle_type = 'motorcycle') > 1;
