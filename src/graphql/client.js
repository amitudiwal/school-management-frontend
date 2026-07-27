import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export const BACKEND_URL =
  window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
    ? `http://${window.location.hostname}:5000`
    : 'https://school-management-backend-izxj.onrender.com';

const httpLink = createHttpLink({
  uri: `${BACKEND_URL}/graphql`
});

const authLink = setContext((_, { headers }) => {
  // Get the token from local storage
  const token = localStorage.getItem('token');

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
