export interface User {
  id:               string;
  id_utilisateur?:  string;
  nom:              string;
  prenom:           string;
  email:            string;
  roles:            string[];
  statut_compte:    string;
  telephone?:       string | null;
  photo_profil?:    string | null;
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
  updateProfile:   (payload: {
    nom: string;
    prenom: string;
    telephone?: string;
    photo_profil?: string;
  }) => Promise<User>;
  changePassword:  (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile:  () => Promise<void>;
  logout:          () => void;
}