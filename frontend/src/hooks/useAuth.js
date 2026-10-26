// Convenience hook: useAuth() anywhere under the providers.
import { useAuthContext } from '../context/AuthContext';
export default function useAuth() { return useAuthContext(); }
