const comma = (str = "") => str.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
export default comma