# HubSpot API – Contactos y Asociaciones

API sencilla para crear y actualizar contactos en HubSpot, y asociarlos a empresas por `location_id`.

### Endpoints

- `POST /api/contact` – Crea o actualiza un contacto, y lo asocia si encuentra la empresa correspondiente.

### Ejemplo JSON

```json
{
  "character_id": "101",
  "firstname": "Rick",
  "lastname": "Sanchez",
  "character_species": "Human",
  "character_gender": "Male",
  "status_character": "Alive",
  "company": "Citadel of Ricks",
  "location_id": "42"
}
