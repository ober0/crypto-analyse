export const UserInclude = {
    omit: {
        password: true
    },
    include: {
        role: true
    }
};

export const UserWithPasswordInclude = {
    include: {
        role: true
    }
};
