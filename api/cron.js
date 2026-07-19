export default async function handler(request, response) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  return response.status(200).json({
    message: "Diagnostic du Token Blob",
    leTokenExisteIl: token ? "Oui ! Il est bien là." : "Non, la variable est vide.",
    longueurDuToken: token ? token.length : 0
  });
}