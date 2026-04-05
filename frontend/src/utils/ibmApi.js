// utils/ibmApi.js
// IBM Watson NLU — auto-extracts land details from uploaded PDF text

const IBM_API_KEY = process.env.REACT_APP_IBM_API_KEY;
const IBM_NLU_URL = process.env.REACT_APP_IBM_NLU_URL ||
  'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com';
const IAM_URL = 'https://iam.cloud.ibm.com/identity/token';

// Step 1: Get IBM IAM access token
const getIBMToken = async () => {
  if (!IBM_API_KEY) throw new Error('IBM API key not set in .env');
  const res = await fetch(IAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_API_KEY}`,
  });
  const data = await res.json();
  return data.access_token;
};

// Step 2: Analyze document text with Watson NLU
// Returns extracted entities: names, locations, numbers
export const analyzeLandDocument = async (documentText) => {
  try {
    const token = await getIBMToken();
    const res = await fetch(`${IBM_NLU_URL}/v1/analyze?version=2022-04-07`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: documentText,
        features: {
          entities: { limit: 20 },
          keywords: { limit: 10 },
        },
      }),
    });
    const data = await res.json();

    // Extract useful fields for land registration form
    const entities = data.entities || [];
    const ownerName = entities.find(e => e.type === 'Person')?.text || '';
    const location  = entities.find(e => e.type === 'Location')?.text || '';

    return { ownerName, location, entities, keywords: data.keywords || [], raw: data };
  } catch (err) {
    console.error('IBM Watson error:', err);
    return { ownerName: '', location: '', entities: [], keywords: [] };
  }
};