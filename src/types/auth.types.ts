export interface User {
  id:               string;
  nom:              string;
  prenom:           string;
  email:            string;
  roles:            string[];
  statut_compte:    string;
  id_organisation?: string;
}

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
  id_organisation?: string;
}

export interface LoginResponse {
  success:     boolean;
  message:     string;
  token:       string;
  utilisateur: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  utilisateur: User & { role?: string };
}

export interface AuthContextType {
  user:            User | null;
  token:           string | null;
  loading:         boolean;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<User>;
  register:        (payload: RegisterRequest) => Promise<User>;
  refreshProfile:  () => Promise<void>;
  logout:          () => void;
}