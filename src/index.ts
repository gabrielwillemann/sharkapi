let server;

export function express(serverExpress) {
  server = serverExpress;
}

export function sequelizeModel(model) {
  server.get(`/${model.tableName}`, async (req, res) => {
    let rows = await model.findAll();
    res.send(rows);
  });
}
