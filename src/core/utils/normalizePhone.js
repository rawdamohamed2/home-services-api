export const normalizePhone = (phone) => {
    if (!phone) return phone;


    phone = phone.replace(/\D/g, "");


    if (phone.startsWith("20")) {
        phone = "0" + phone.slice(2);
    }


    if (phone.length === 10 && phone.startsWith("1")) {
        phone = "0" + phone;
    }

    return phone;
};