export const APP_DISPLAY_NAME = 'Mahakali Farm & Nursery';

export const getDisplayCompanyName = (name, code = '') => {
    const fromName = name || '';
    const fromCode = code || '';

    if (/asopalav/i.test(fromName) || /asopalav/i.test(fromCode) || !fromName) {
        return APP_DISPLAY_NAME;
    }

    return fromName;
};

export const getDisplayPersonName = (name) => {
    if (!name) {
        return name;
    }

    return name.replace(/asopalav/gi, 'Mahakali').replace(/\s+/g, ' ').trim();
};

export const applyBrandingToCompany = (company) => {
    if (!company) {
        return company;
    }

    return {
        ...company,
        name: getDisplayCompanyName(company.name, company.code)
    };
};

export const applyBrandingToUser = (user) => {
    if (!user) {
        return user;
    }

    return {
        ...user,
        name: getDisplayPersonName(user.name)
    };
};
