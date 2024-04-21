const dupliquerArray = require('./dupliquerArray')

test('duplique correctement un array', () => {
    const array = [1,2,3]
    expect(dupliquerArray(array)).toEqual(array)
    expect(dupliquerArray(array)).not.toBe(array)
})
