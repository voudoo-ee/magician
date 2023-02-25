import { Router } from "itty-router"
import * as Realm from "realm-web"
import * as utils from "./utils.js"

let app = Realm.getApp(MONGO_APP_ID)
const router = Router()
let headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
}

router.get("/", () => {
    return Response.redirect("https://www.voudoo.me", 301)
})

router.get("/get_product/:id", async ({ params }) => {
    const client = await utils.login(app)
    const products = await utils.getProduct(
        client,
        {
            _id: new Realm.BSON.ObjectId(params.id),
        },
        PRODUCTS_COL
    )

    // Change this after fixing the ObjectID search
    if (products === null)
        return new Response(
            JSON.stringify({
                error: "Search via ObjectID is currently disabled.",
            }),
            {
                status: 500,
            }
        )

    return new Response(JSON.stringify(products), { headers: headers })
})

router.get("/get_product_ean/:ean", async ({ params }) => {
    const client = await utils.login(app)
    const result = await utils.getProduct(
        client,
        { ean: parseInt(params.ean) },
        PRODUCTS_COL
    )
    if (result === null)
        return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
        })

    return new Response(JSON.stringify(result), { headers: headers })
})

router.get("/get_product_fuzzy/:fuzzy", async ({ params }) => {
    const client = await utils.login(app)
    const pipeline = [
        {
            $search: {
                autocomplete: {
                    query: params.fuzzy,
                    path: "name",
                },
            },
        },
        { $limit: 100 },
        { $project: { _id: 0 } },
    ]

    const products = await utils.getProducts(client, pipeline, MATCHES_COL)
    if (products === null)
        return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
        })

    return new Response(JSON.stringify(products), { headers: headers })
})

router.get("/get_random/:count", async ({ params }) => {
    const client = await utils.login(app)
    let doc_count = parseInt(params.count) > 20 ? 20 : parseInt(params.count)
    const pipeline = [
        { $sample: { size: doc_count } },
        { $project: { _id: 0 } },
    ]

    const products = await utils.getProducts(client, pipeline, MATCHES_COL)
    if (products === null)
        return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
        })

    return new Response(JSON.stringify(products), { headers: headers })
})

router.all("*", () => new Response("Not found!", { status: 404 }))

addEventListener("fetch", e => {
    e.respondWith(router.handle(e.request))
})
