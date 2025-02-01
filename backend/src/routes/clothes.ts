import { Hono } from 'hono'
import { Env } from '../index'
import { db } from '../repository'
import { categories } from '../repository/categories'
import { uploadImageToR2, getImageFromR2, deleteImagesFromR2 } from '../r2'

const clothesRoutes = new Hono<{ Bindings: Env }>();

clothesRoutes.post('/clothes', async (c) => {
  const formData = await c.req.formData();
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const size = formData.get('size') as string;
  const color = formData.get('color') as string;
  const brand = formData.get('brand') as string;
  const userID = formData.get('userID') as string;  // email
  const imageFile = formData.get('image') as File;
  const imageURL = formData.get('imageURL') as string;

  if (!categories.includes(category)) {
    return c.json({ message: 'Invalid category' }, 400);
  }

  if (imageFile && imageURL) {
    return c.json({ message: 'Cannot provide both image file and image URL' }, 400);
  }

  if (imageFile && imageFile.size > 2 * 1024 * 1024) { // 2MB
    return c.json({ message: 'Image size is too large' }, 400);
  }

  let imageKey;
  if (imageFile) {
    imageKey = await uploadImageToR2(c.env, userID, imageFile);
  }

  const database = db(c.env);
  await database.clothes.create({ name, category, size, color, brand, imageKey, imageURL, userID });
  return c.json({ message: 'Clothes added' }, 201);
})

clothesRoutes.get('/clothes', async (c) => {
  const database = db(c.env);
  const email = c.req.query('userID');

  if (!email) {
    return c.json({ message: 'No userID' }, 401);
  }

  const clothes = await database.clothes.findMany({ userID: email });
  if (!clothes) {
    return c.json([]); // No clothes
  }

  const clothesWithImages = await Promise.all(clothes.map(async (item) => {
    if (item.imageKey) {
      item.imageFile = await getImageFromR2(c.env, item.imageKey);
    }

    const { imageKey, ...itemWithoutImageKey } = item;
    return itemWithoutImageKey;
  }));

  return c.json(clothesWithImages);
});

clothesRoutes.get('/clothes/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const email = c.req.query('userID');

  if (!email) {
    return c.json({ message: 'No userID' }, 401);
  }

  const database = db(c.env);
  const clothes = await database.clothes.findUnique({ id, userID: email });

  if (clothes) {
    if (clothes.imageKey) {
      clothes.imageFile = await getImageFromR2(c.env, clothes.imageKey);
    }

    const { imageKey, ...itemWithoutImageKey } = clothes;
    return c.json(itemWithoutImageKey);
  }

  return c.json({});
});

clothesRoutes.put('/clothes/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const formData = await c.req.formData();
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const size = formData.get('size') as string;
  const color = formData.get('color') as string;
  const brand = formData.get('brand') as string;
  const userID = formData.get('userID') as string;
  const imageFile = formData.get('imageFile') as File;
  const imageURL = formData.get('imageURL') as string;
  console.log(formData);

  if (!categories.includes(category)) {
    return c.json({ message: 'Invalid category' }, 400);
  }
  if (imageFile && imageURL) {
    return c.json({ message: 'Cannot provide both image file and image URL' }, 400);
  }

  if (imageFile && imageFile.size > 2 * 1024 * 1024) { // 2MB
    return c.json({ message: 'Image size is too large' }, 400);
  }

  const database = db(c.env);
  const existingClothes = await database.clothes.findUnique({ id, userID });

  if (existingClothes) {
    let imageKey = existingClothes.imageKey;
    if (existingClothes.imageKey && (imageFile || imageURL)) {
      await deleteImagesFromR2(c.env, existingClothes.imageKey);
      imageKey = null;
    }
    if (imageFile) {
      imageKey = await uploadImageToR2(c.env, existingClothes.userID, imageFile);
    }

    const updateData: any = {
      name,
      category,
      size,
      color,
      brand,
      imageKey: imageKey,
      imageURL: imageURL || null,
    };
    console.log(updateData);

    await database.clothes.update({ id, ...updateData });
    return c.json({ message: 'Clothes updated' }, 200);
  }

  return c.json({ message: 'Clothes not found' }, 404);
});

clothesRoutes.delete('/clothes/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const email = c.req.query('userID');

  if (!email) {
    return c.json({ message: 'No userID' }, 401);
  }

  const database = db(c.env);
  await database.wearHistory.deleteByCloth({ email, clothesID: id });
  await database.clothes.delete({ id, userID: email });
  return c.json({ message: 'Clothes deleted' }, 200);
});

export default clothesRoutes;
