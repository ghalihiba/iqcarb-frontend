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

export interface LoginResponse {
  success:     boolean;
  message:     string;
  token:       string;
  utilisateur: User;
}

export interface AuthContextType {
  user:            User | null;
  token:           string | null;
  loading:         boolean;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<User>;
  logout:          () => void;
}