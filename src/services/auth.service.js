import userRepository from "../repository/user.repository.js";

class AuthService {
    async getOmegaAtus() {
        return userRepository.findAtus();
    }
}

export default new AuthService();
