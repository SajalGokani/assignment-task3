import axios, { AxiosResponse } from 'axios';

export const uploadImage = (imageBase64: string): Promise<AxiosResponse> => {
    // Force the active ImgBB API key string
    const apiKey = '8d6e0c0a147ccda5cc6ce313d132360c';

    // Strip base64 prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const formData = new FormData();
    formData.append('image', cleanBase64);

    return axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};