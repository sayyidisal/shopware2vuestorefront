

module.exports = function (restClient) {
  let module = {};
  let url = 'checkout/';
  function getResponse(data){
    if (data.code === 200){
      return data.result;
    }

    return false;
  }

  const search = (type, filter, token) => {

    return restClient.post(`${type}?response=true`, {
      filter: [{
          field: filter.identifier ? filter.identifier : 'name',
          type: 'equals',
          value: filter.value
      }]
    }, token)
  }
  
  module.create = async (orderData) => {
    // decide whether it's guest or not.
    // TODO: validate user_id
    if (orderData.user_id) {
      url += 'order'
    } else {
      url += 'guest-order';
    }

    const { addressInformation: { shippingAddress, billingAddress } } = orderData
        // TODO: discover salutation from customer's name
        const salutationResponse = await search('salutation', { identifier: 'displayName', value: 'Mr.' }, orderData.cart_id)
        const countryResponse = await search('country', { identifier: 'iso', value: billingAddress.country_id }, orderData.cart_id)
        const salutationId = salutationResponse.data.shift().id
        const countryId = countryResponse.data.shift().id
       
        const customerInfo = {
          'email': billingAddress.email,
          'salutationId': salutationId,
          'firstName' : billingAddress.firstname,
          'lastName' : billingAddress.lastname,
          'countryId' : countryId,
          'billingAddress' : {
              'countryId' : countryId,
              'salutationId': salutationId,
              'street': billingAddress.street.join(' '),
              'zipcode': billingAddress.postcode,
              'city': billingAddress.city,
            }
          }

        return restClient.post(url, customerInfo, orderData.cart_id).then((data)=> {
          return getResponse({
            code: 200,
            result: 'OK',
          });
          
        }).catch(e => console.log('error: ',e))
  }

  return module;
}
