const axios = require('axios');
const FormData = require('form-data');

async function testEmptyCuponId() {
  try {
    console.log(`\n--- Requesting Code with Empty Coupon ID ---`);
    const formData = new FormData();
    formData.append('key', 'DG7xN1fp5wmr60YnPizhhEbYCT4ivTOiVDYoLXdKEn9Zhb1nipHIJEDHuyn69bWq');
    formData.append('micrositio_id', '911299');
    formData.append('codigo_afiliado', '65168161');
    formData.append('split', '1');

    const url = `https://apiv1.cuponstar.com/api/cupones//codigo`;
    await axios.post(url, formData, { headers: formData.getHeaders() });
    console.log('Success');
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testEmptyCuponId();
