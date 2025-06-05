// src/routes/contact.js
const express = require('express');
const router = express.Router();
const hubspot = require('@hubspot/api-client');

// Inicializamos los clientes para ambas cuentas
const hubspotMain = new hubspot.Client({ accessToken: process.env.HUBSPOT_TOKEN_MAIN });
const hubspotMirror = new hubspot.Client({ accessToken: process.env.HUBSPOT_TOKEN_MIRROW });

// 🔄 Ruta para sincronizar contacto
router.post('/sync', async (req, res, next) => {
  try {
    const {
      character_id,
      firstname,
      lastname,
      character_species,
      character_gender,
      status_character,
      company_name
    } = req.body;

    // 1. Buscar contacto en cuenta Mirror por character_id
    const contactSearch = await hubspotMirror.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'character_id',
          operator: 'EQ',
          value: character_id
        }]
      }],
      properties: ['character_id']
    });
  console.log('Respuesta contactSearch:', contactSearch);

    let mirrorContactId = null;
    if (contactSearch.body.results.length > 0) {
      // Ya existe el contacto → actualizar
      mirrorContactId = contactSearch.body.results[0].id;
      await hubspotMirror.crm.contacts.basicApi.update(mirrorContactId, {
        properties: {
          firstname,
          lastname,
          character_species,
          character_gender,
          status_character,
          character_id
        }
      });
    } else {
      // No existe → crear
      const createResp = await hubspotMirror.crm.contacts.basicApi.create({
        properties: {
          firstname,
          lastname,
          character_species,
          character_gender,
          status_character,
          character_id
        }
      });
      mirrorContactId = createResp.id;
    }

    // 2. Buscar empresa en cuenta Main por nombre
    const companySearchMain = await hubspotMain.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'name',
          operator: 'EQ',
          value: company_name
        }]
      }],
      properties: ['location_id']
    });

    if (companySearchMain.body.results.length === 0) {
      return res.status(404).json({ message: 'Empresa no encontrada en cuenta Main' });
    }

    const locationId = companySearchMain.body.results[0].properties.location_id;

    // 3. Buscar empresa en cuenta Mirror por location_id
    const companySearchMirror = await hubspotMirror.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'location_id',
          operator: 'EQ',
          value: locationId
        }]
      }],
      properties: []
    });

    if (companySearchMirror.body.results.length === 0) {
      return res.status(404).json({ message: 'Empresa no encontrada en cuenta Mirror' });
    }

    const mirrorCompanyId = companySearchMirror.body.results[0].id;

    // 4. Asociar contacto con empresa en Mirror
    await hubspotMirror.crm.associations.v4.batchApi.create('contacts', 'companies', {
      inputs: [{
        _from: { id: mirrorContactId },
        to: { id: mirrorCompanyId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 1 // Billing Contact (Many)
        }]
      }]
    });

    res.status(200).json({ message: 'Contacto sincronizado y asociado correctamente.' });

  } catch (error) {
    console.error('Error al sincronizar contacto:', error);
    next(error);
  }
});

module.exports = router;
