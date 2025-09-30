import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5678/api/superadmin';

const testSuperAdminAPI = async () => {
    console.log('🧪 Testing SuperAdmin API...\n');

    try {
        // Test 1: SuperAdmin Login
        console.log('1. Testing SuperAdmin Login...');
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@superadmin.com',
                password: 'TestAdmin@123'
            })
        });

        const loginData = await loginResponse.json();

        if (loginData.success) {
            console.log('✅ Login successful');
            console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
            console.log(`   User: ${loginData.user.name} (${loginData.user.email})`);

            const token = loginData.token;

            // Test 2: Get All Companies
            console.log('\n2. Testing Get All Companies...');
            const companiesResponse = await fetch(`${API_BASE_URL}/companies`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const companiesData = await companiesResponse.json();

            if (companiesData.success) {
                console.log('✅ Companies fetched successfully');
                console.log(`   Total Companies: ${companiesData.count}`);
                if (companiesData.data.length > 0) {
                    console.log(`   First Company: ${companiesData.data[0].name} (${companiesData.data[0].code})`);
                }
            } else {
                console.log('❌ Failed to fetch companies');
                console.log(`   Error: ${companiesData.message}`);
            }

            // Test 3: Get SuperAdmin Profile
            console.log('\n3. Testing Get SuperAdmin Profile...');
            const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const profileData = await profileResponse.json();

            if (profileData.success) {
                console.log('✅ Profile fetched successfully');
                console.log(`   Name: ${profileData.data.name}`);
                console.log(`   Email: ${profileData.data.email}`);
                console.log(`   Role: ${profileData.data.role}`);
                console.log(`   Permissions: ${JSON.stringify(profileData.data.permissions)}`);
            } else {
                console.log('❌ Failed to fetch profile');
                console.log(`   Error: ${profileData.message}`);
            }

            // Test 4: Create Test Company
            console.log('\n4. Testing Create Company...');
            const createCompanyResponse = await fetch(`${API_BASE_URL}/companies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'API Test Company',
                    code: 'APITEST001',
                    email: 'test@apitest.com',
                    industry: 'Technology',
                    description: 'Company created via API test'
                })
            });

            const createCompanyData = await createCompanyResponse.json();

            if (createCompanyData.success) {
                console.log('✅ Company created successfully');
                console.log(`   Company ID: ${createCompanyData.data._id}`);
                console.log(`   Company Name: ${createCompanyData.data.name}`);
                console.log(`   Company Code: ${createCompanyData.data.code}`);

                const companyId = createCompanyData.data._id;

                // Test 5: Update Company
                console.log('\n5. Testing Update Company...');
                const updateCompanyResponse = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: 'Updated API Test Company',
                        description: 'Updated via API test'
                    })
                });

                const updateCompanyData = await updateCompanyResponse.json();

                if (updateCompanyData.success) {
                    console.log('✅ Company updated successfully');
                    console.log(`   Updated Name: ${updateCompanyData.data.name}`);
                } else {
                    console.log('❌ Failed to update company');
                    console.log(`   Error: ${updateCompanyData.message}`);
                }

                // Test 6: Delete Company
                console.log('\n6. Testing Delete Company...');
                const deleteCompanyResponse = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const deleteCompanyData = await deleteCompanyResponse.json();

                if (deleteCompanyData.success) {
                    console.log('✅ Company deleted successfully');
                } else {
                    console.log('❌ Failed to delete company');
                    console.log(`   Error: ${deleteCompanyData.message}`);
                }

            } else {
                console.log('❌ Failed to create company');
                console.log(`   Error: ${createCompanyData.message}`);
            }

        } else {
            console.log('❌ Login failed');
            console.log(`   Error: ${loginData.message}`);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n🏁 SuperAdmin API testing completed!');
};

// Run the test
testSuperAdminAPI();
