export const UserInclude = {
    omit: {
        password: true
    },
    include: {
        individualUser: true,
        legalUser: true,
        role: true
    }
};

export const UserWithPasswordInclude = {
    include: {
        individualUser: true,
        legalUser: true,
        role: true
    }
};
