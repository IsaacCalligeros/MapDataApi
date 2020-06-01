using Microsoft.AspNetCore.Http;
using System;
using MapDataApi.Dtos.WorldBankDataDto;
using System.Collections.Generic;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace MapDataApi.Dtos
{
    public partial class PurpleCountryDataDto
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string Id { get; set; }

        [JsonProperty("iso2Code", NullValueHandling = NullValueHandling.Ignore)]
        public string Iso2Code { get; set; }

        [JsonProperty("name", NullValueHandling = NullValueHandling.Ignore)]
        public string Name { get; set; }

        [JsonProperty("region", NullValueHandling = NullValueHandling.Ignore)]
        public Adminregion Region { get; set; }

        [JsonProperty("adminregion", NullValueHandling = NullValueHandling.Ignore)]
        public Adminregion Adminregion { get; set; }

        [JsonProperty("incomeLevel", NullValueHandling = NullValueHandling.Ignore)]
        public Adminregion IncomeLevel { get; set; }

        [JsonProperty("lendingType", NullValueHandling = NullValueHandling.Ignore)]
        public Adminregion LendingType { get; set; }

        [JsonProperty("capitalCity", NullValueHandling = NullValueHandling.Ignore)]
        public string CapitalCity { get; set; }

        [JsonProperty("longitude", NullValueHandling = NullValueHandling.Ignore)]
        public string Longitude { get; set; }

        [JsonProperty("latitude", NullValueHandling = NullValueHandling.Ignore)]
        public string Latitude { get; set; }
    }

    public partial class Adminregion
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string Id { get; set; }

        [JsonProperty("iso2code", NullValueHandling = NullValueHandling.Ignore)]
        public string Iso2Code { get; set; }

        [JsonProperty("value", NullValueHandling = NullValueHandling.Ignore)]
        public string Value { get; set; }
    }

    public partial class FluffyCountryDataDto
    {
        [JsonProperty("page", NullValueHandling = NullValueHandling.Ignore)]
        public long? Page { get; set; }

        [JsonProperty("pages", NullValueHandling = NullValueHandling.Ignore)]
        public long? Pages { get; set; }

        [JsonProperty("per_page", NullValueHandling = NullValueHandling.Ignore)]
        [JsonConverter(typeof(ParseStringConverter))]
        public long? PerPage { get; set; }

        [JsonProperty("total", NullValueHandling = NullValueHandling.Ignore)]
        public long? Total { get; set; }
    }

    public partial struct CountryDataDtoUnion
    {
        public FluffyCountryDataDto FluffyCountryDataDto;
        public PurpleCountryDataDto[] PurpleCountryDataDtoArray;

        public static implicit operator CountryDataDtoUnion(FluffyCountryDataDto FluffyCountryDataDto) => new CountryDataDtoUnion { FluffyCountryDataDto = FluffyCountryDataDto };
        public static implicit operator CountryDataDtoUnion(PurpleCountryDataDto[] PurpleCountryDataDtoArray) => new CountryDataDtoUnion { PurpleCountryDataDtoArray = PurpleCountryDataDtoArray };
    }

    public class CountryDataDto
    {
        public static CountryDataDtoUnion[] FromJson(string json) => JsonConvert.DeserializeObject<CountryDataDtoUnion[]>(json, MapDataApi.Dtos.Converter.Settings);
    }

    public static class Serialize
    {
        public static string ToJson(this CountryDataDtoUnion[] self) => JsonConvert.SerializeObject(self, MapDataApi.Dtos.Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters =
            {
                CountryDataDtoUnionConverter.Singleton,
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }

    internal class CountryDataDtoUnionConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(CountryDataDtoUnion) || t == typeof(CountryDataDtoUnion?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.StartObject:
                    var objectValue = serializer.Deserialize<FluffyCountryDataDto>(reader);
                    return new CountryDataDtoUnion { FluffyCountryDataDto = objectValue };
                case JsonToken.StartArray:
                    var arrayValue = serializer.Deserialize<PurpleCountryDataDto[]>(reader);
                    return new CountryDataDtoUnion { PurpleCountryDataDtoArray = arrayValue };
            }
            throw new Exception("Cannot unmarshal type CountryDataDtoUnion");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            var value = (CountryDataDtoUnion)untypedValue;
            if (value.PurpleCountryDataDtoArray != null)
            {
                serializer.Serialize(writer, value.PurpleCountryDataDtoArray);
                return;
            }
            if (value.FluffyCountryDataDto != null)
            {
                serializer.Serialize(writer, value.FluffyCountryDataDto);
                return;
            }
            throw new Exception("Cannot marshal type CountryDataDtoUnion");
        }

        public static readonly CountryDataDtoUnionConverter Singleton = new CountryDataDtoUnionConverter();
    }

    internal class ParseStringConverter : JsonConverter
    {
        public override bool CanConvert(Type t) => t == typeof(long) || t == typeof(long?);

        public override object ReadJson(JsonReader reader, Type t, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            var value = serializer.Deserialize<string>(reader);
            long l;
            if (Int64.TryParse(value, out l))
            {
                return l;
            }
            throw new Exception("Cannot unmarshal type long");
        }

        public override void WriteJson(JsonWriter writer, object untypedValue, JsonSerializer serializer)
        {
            if (untypedValue == null)
            {
                serializer.Serialize(writer, null);
                return;
            }
            var value = (long)untypedValue;
            serializer.Serialize(writer, value.ToString());
            return;
        }

        public static readonly ParseStringConverter Singleton = new ParseStringConverter();
    }
}