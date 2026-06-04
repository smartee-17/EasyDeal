export const CacheKeys = {
    user: (id) => `user:${id}`,
    productImage: (id) => `productImage:${id}`,
    profile: (id) => `profile:${id}`,
    product: () => `product:${id}`
}