const isValidDate = (dateString) => {
    // Check if the string matches the format YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(dateString)) {
        return false;
    }

    // Parse the date to ensure it's valid
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);

    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );
};

module.exports = isValidDate;