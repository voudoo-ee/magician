import * as Realm from "realm-web"

export async function login(app) {
    let client = null
    try {
        let user = await app.logIn(Realm.Credentials.apiKey(MONGO_API_KEY))
        client = user.mongoClient("mongodb-atlas")
    } catch (err) {
        return new Response(JSON.stringify({ err }), {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
        })
    }
    return client
}

export async function getProducts(client, pipeline, collection) {
    let products = []
    let results = await client
        .db(DB_ENV)
        .collection(collection)
        .aggregate(pipeline)

    for (let result of results) products.push(result)
    if (results === null) return null

    return products
}

export async function getProduct(client, filter, collection) {
    let product = await client
        .db(DB_ENV)
        .collection(collection)
        .findOne(filter)

    if (product === null) return null

    return product
}
