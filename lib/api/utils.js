export const toYYYY_MM_DD_T_HH_mm = (date) => {
    const d = new Date(new Date(date) - new Date().getTimezoneOffset() * 60000)
    return d.toISOString().slice(0,16)
}