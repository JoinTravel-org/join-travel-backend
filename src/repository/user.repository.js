class UserRepository {
    async findAtus() {
        return {
            "atus?": "yes, atus"
        };
    }
}

export default new UserRepository();
