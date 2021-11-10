exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('blogs')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('blogs').insert([
        {
          author: 'Stephane',
          title: 'Stephs Blog Title',
          content: 'First Blog',
        },
        {
          author: 'Reza',
          title: 'Rezas Blog Title',
          content: 'First Blog',
        },
        {
          author: 'Alfa',
          title: 'Alfas Blog Title',
          content: 'First Blog',
        },
      ]);
    });
};
