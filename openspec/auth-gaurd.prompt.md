# OPD wallet application:

# TASK 
  - Need to authenticate the hole application
  - Validate the the cookie storage with session_id 
    - session_id is available in the cookie we should call the application master api and validate the api response 
      - response should get the 200 and get the response value 
      - if getting 200 but not getting response | error message we should redirect to show the error page with error message (invalid session | session expiered )
        - api already integrated check this api details 
          - http://localhost:4500/account-management/api/v1/application_master?queryId=GET_MY_CONFIG&args=dummy:dummy,account_url:wellnessdevhh.hclhealthcare.in&application=account-management
  - This all api call should check the error handling 
  